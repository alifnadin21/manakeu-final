const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-'.repeat(4);
process.env.REDIS_ENABLED = 'false';
process.env.GOOGLE_CLIENT_ID = '';
process.env.GOOGLE_CLIENT_SECRET = '';
process.env.WHATSAPP_ENABLED = 'false';
let query, calls, events, account;
const connection = {
    query: (...args) => {
        if (['START TRANSACTION', 'COMMIT', 'ROLLBACK'].includes(args[0]))
            events.push(
                {
                    'START TRANSACTION': 'begin',
                    COMMIT: 'commit',
                    ROLLBACK: 'rollback'
                }[args[0]]
            );
        return query(...args);
    },
    beginTransaction: async () => events.push('begin'),
    commit: async () => events.push('commit'),
    rollback: async () => events.push('rollback'),
    release: () => events.push('release')
};
const pool = {
    query: (...args) => query(...args),
    getConnection: async () => connection
};
require.cache[require.resolve('../config/database')] = {
    exports: { promise: () => pool }
};
require.cache[require.resolve('../config/redis')] = {
    exports: {
        get: async () => null,
        setex: async () => null,
        scan: async () => ['0', []],
        disconnect() {},
        ping: async () => 'PONG'
    }
};
const app = require('../app');
const h = require('../utils/http');
let server, base;
const token = () =>
    jwt.sign({ ID_User: 1, Role: 'Admin' }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });
async function request(path, method = 'GET', body, authenticated = true) {
    const response = await fetch(base + path, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(authenticated ? { Authorization: 'Bearer ' + token() } : {})
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { status: response.status, body: await response.json() };
}
before(async () => {
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    base = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
    await new Promise((resolve) => server.close(resolve));
});
beforeEach(() => {
    calls = [];
    events = [];
    account = {
        ID_User: 1,
        Nama: 'Test User',
        Email: 'test@example.com',
        Role: 'User',
        Status: 'Active'
    };
    query = async (sql, args) => {
        calls.push({ sql, args });
        if (sql.includes('SELECT ID_User, Nama, Email, Role, Status FROM user'))
            return [[account]];
        throw new Error('Unexpected SQL: ' + sql);
    };
});
function respond(handler) {
    const auth = query;
    query = async (sql, args) =>
        sql.includes('SELECT ID_User, Nama, Email, Role, Status FROM user')
            ? auth(sql, args)
            : handler(sql, args);
}
test('all sensitive route groups require authentication', async () => {
    for (const path of [
        '/api/projects',
        '/api/transaksi',
        '/api/nota',
        '/api/approval',
        '/api/users',
        '/api/logs',
        '/api/complex/project-monthly',
        '/api/redis/user/dashboard/1',
        '/api/whatsapp/status',
        '/api/twilio/logs',
        '/api/payments/status/example'
    ])
        assert.equal(
            (await request(path, 'GET', undefined, false)).status,
            401,
            path
        );
    assert.equal(calls.length, 0);
});
test('current database role overrides forged or stale Admin claim', async () => {
    assert.equal((await request('/api/users')).status, 403);
});
test('deactivated account cannot use an unexpired token', async () => {
    account.Status = 'Inactive';
    assert.equal((await request('/api/auth/me')).status, 401);
});
test('public registration cannot create an administrator', async () => {
    const result = await request(
        '/api/auth/register',
        'POST',
        {
            Nama: 'Test Admin',
            Email: 'admin@example.com',
            Password: 'Secure123',
            Role: 'Admin'
        },
        false
    );
    assert.equal(result.status, 403);
    assert.equal(calls.length, 0);
});
test('registration validates input types instead of throwing', async () => {
    assert.equal(
        (
            await request(
                '/api/auth/register',
                'POST',
                { Nama: {}, Email: 'a@example.com', Password: 123 },
                false
            )
        ).status,
        400
    );
});
test('registration stores a hash and assigns User and Active', async () => {
    respond(async (sql, args) => {
        calls.push({ sql, args });
        if (sql.startsWith('SELECT')) return [[]];
        return [{ insertId: 9 }];
    });
    const result = await request(
        '/api/auth/register',
        'POST',
        { Nama: 'New Member', Email: 'new@example.com', Password: 'Secure123' },
        false
    );
    assert.equal(result.status, 201);
    const insert = calls.find((c) => c.sql.startsWith('INSERT INTO user'));
    assert.equal(insert.args[3], 'User');
    assert.match(insert.sql, /'Active'/);
    assert.ok(await bcrypt.compare('Secure123', insert.args[2]));
});
test('login returns a usable JWT without password hash', async () => {
    const password = await bcrypt.hash('Secure123', 4);
    respond(async (sql) =>
        sql.startsWith('SELECT')
            ? [[{ ...account, Password: password }]]
            : [{ insertId: 1 }]
    );
    const result = await request(
        '/api/auth/login',
        'POST',
        { Email: 'test@example.com', Password: 'Secure123' },
        false
    );
    assert.equal(result.status, 200);
    assert.equal(
        jwt.verify(result.body.token, process.env.JWT_SECRET).ID_User,
        1
    );
    assert.equal(result.body.user.Password, undefined);
});
test('disabled account cannot login', async () => {
    respond(async () => [
        [
            {
                ...account,
                Status: 'Inactive',
                Password: await bcrypt.hash('Secure123', 4)
            }
        ]
    ]);
    assert.equal(
        (
            await request(
                '/api/auth/login',
                'POST',
                { Email: 'test@example.com', Password: 'Secure123' },
                false
            )
        ).status,
        401
    );
});
test('owner scope rejects another project before write', async () => {
    respond(async () => [[{ ID_Project: 2, ID_User: 2 }]]);
    assert.equal(
        (
            await request('/api/projects/2', 'PUT', {
                Nama_Project: 'Changed',
                Status: 'Active'
            })
        ).status,
        403
    );
    assert.deepEqual(events, ['begin', 'rollback', 'release']);
});
test('project create derives owner from authenticated account', async () => {
    respond(async (sql, args) => {
        calls.push({ sql, args });
        return [{ insertId: 7 }];
    });
    const result = await request('/api/projects', 'POST', {
        Nama_Project: 'Website',
        Status: 'Active',
        Deskripsi: '',
        ID_User: 99
    });
    assert.equal(result.status, 201);
    assert.equal(
        calls.find((c) => c.sql.startsWith('INSERT INTO project')).args[0]
            .ID_User,
        1
    );
    assert.deepEqual(events, ['begin', 'commit', 'release']);
});
test('financial input rejects negative, exponent, excessive precision and object amounts', () => {
    for (const value of [-1, 0, '1e3', '12.345', {}, '10000000000000'])
        assert.throws(() => h.amount(value));
    assert.equal(h.amount('9999999999999.99'), '9999999999999.99');
    assert.equal(h.amount('0.01'), '0.01');
});
test('dates reject impossible calendar values and pagination is bounded', () => {
    for (const value of ['2025-02-29', '2025-13-01', '2025-04-31'])
        assert.throws(() => h.date(value));
    assert.equal(h.date('2024-02-29'), '2024-02-29');
    for (const q of [
        { page: -1 },
        { limit: 101 },
        { page: '1abc' },
        { limit: ['1', '2'] }
    ])
        assert.throws(() => h.pagination(q));
});
test('transactions reject invalid amounts before issuing an insert', async () => {
    assert.equal(
        (
            await request('/api/transaksi', 'POST', {
                ID_Project: 1,
                Jenis_Transaksi: 'Pengeluaran',
                Jumlah: -100,
                Tanggal_Transaksi: '2026-09-23'
            })
        ).status,
        400
    );
    assert.deepEqual(events, ['begin', 'rollback', 'release']);
});
test('list pagination and search remain parameterized and owner-scoped', async () => {
    respond(async (sql, args) => {
        calls.push({ sql, args });
        return sql.includes('COUNT(*)') ? [[{ total: 5 }]] : [[]];
    });
    const result = await request(
        '/api/transaksi?page=2&limit=2&search=%27%20OR%201%3D1'
    );
    assert.equal(result.status, 200);
    assert.equal(result.body.pagination.total, 5);
    const select = calls.find((c) => c.sql.startsWith('SELECT *'));
    assert.match(select.sql, /ID_User = ?/);
    assert.ok(!select.sql.includes('OR 1=1'));
    assert.deepEqual(select.args.slice(-2), [2, 2]);
});
test('receipt status SQL injection rejected before querying receipts', async () => {
    assert.equal(
        (
            await request(
                '/api/complex/user-nota-status/1?status=Approved%27%20OR%201%3D1'
            )
        ).status,
        400
    );
    assert.equal(calls.length, 1);
});
test('cross-user reports and cache entries are forbidden', async () => {
    for (const path of [
        '/api/complex/user-transaction-history/2',
        '/api/redis/user/dashboard/2',
        '/api/redis/session/2'
    ])
        assert.equal((await request(path)).status, 403);
});
test('users list never selects password or API key', async () => {
    account.Role = 'Admin';
    respond(async (sql, args) => {
        calls.push({ sql, args });
        return sql.includes('COUNT(*)') ? [[{ total: 0 }]] : [[]];
    });
    assert.equal((await request('/api/users')).status, 200);
    assert.ok(
        calls
            .filter((c) => c.sql.includes('FROM user'))
            .every(
                (c) =>
                    !c.sql.includes('SELECT *') &&
                    !c.sql.includes('Password') &&
                    !c.sql.includes('API_Key')
            )
    );
});
test('transaction helper rolls back and releases on mid-write failure', async () => {
    await assert.rejects(
        h.transaction(async () => {
            throw new Error('write failed');
        }),
        /write failed/
    );
    assert.deepEqual(events, ['begin', 'rollback', 'release']);
});
test('bulk approvals reject invalid statuses before modifying rows', async () => {
    account.Role = 'Admin';
    assert.equal(
        (
            await request('/api/complex/bulk-nota-approval', 'PUT', {
                nota_ids: [1],
                status: 'Hacked'
            })
        ).status,
        400
    );
    assert.deepEqual(events, []);
});
test('bulk approvals roll back when any receipt is missing', async () => {
    account.Role = 'Admin';
    respond(async (sql) =>
        sql.includes('SELECT ID_Nota, Status_Verifikasi') ? [[]] : [{}]
    );
    assert.equal(
        (
            await request('/api/complex/bulk-nota-approval', 'PUT', {
                nota_ids: [999],
                status: 'Approved'
            })
        ).status,
        404
    );
    assert.deepEqual(events, ['begin', 'rollback', 'release']);
});
test('approved receipt cannot be edited by its owner', async () => {
    respond(async () => [
        [{ ID_Nota: 1, ID_User: 1, Status_Verifikasi: 'Approved' }]
    ]);
    assert.equal(
        (await request('/api/nota/1', 'PUT', { File_Nota: 'new.pdf' })).status,
        409
    );
    assert.deepEqual(events, ['begin', 'rollback', 'release']);
});
test('user activity report correctly unpacks mysql results', async () => {
    let index = 0;
    respond(async () => [
        [
            [{ total_transaksi: 2, total_nilai_transaksi: '300.00' }],
            [{ total_nota: 1 }],
            [
                {
                    tanggal: '2026-09-23',
                    jumlah_aktivitas: 1,
                    detail_aktivitas: 'Login'
                }
            ]
        ][index++],
        []
    ]);
    const result = await request('/api/complex/user-activity-report', 'POST', {
        user_id: 1,
        start_date: '2026-09-01',
        end_date: '2026-09-30'
    });
    assert.equal(result.status, 200);
    assert.equal(
        result.body.data.ringkasan_transaksi.rata_rata_nilai,
        '150.00'
    );
    assert.deepEqual(result.body.data.aktivitas_harian[0].detail_aktivitas, [
        'Login'
    ]);
});
test('unsigned payment notifications are rejected without DB writes', async () => {
    process.env.MIDTRANS_SERVER_KEY = 'test-server-key';
    assert.equal(
        (
            await request(
                '/api/payments/notification',
                'POST',
                { order_id: 'test' },
                false
            )
        ).status,
        401
    );
    assert.equal(calls.length, 0);
});
test('Midtrans notification signature is checked in constant-time comparison', () => {
    const service = require('../utils/midtransService');
    process.env.MIDTRANS_SERVER_KEY = 'test-key';
    const body = {
        order_id: 'MK-test',
        status_code: '200',
        gross_amount: '100.00'
    };
    body.signature_key = crypto
        .createHash('sha512')
        .update('MK-test200100.00test-key')
        .digest('hex');
    assert.doesNotThrow(() => service.verifyNotification(body));
    assert.throws(() =>
        service.verifyNotification({ ...body, gross_amount: '1000.00' })
    );
});
test('Swagger and missing routes return expected responses', async () => {
    assert.equal(
        (await request('/api-docs.json', 'GET', undefined, false)).status,
        200
    );
    assert.equal(
        (await request('/does-not-exist', 'GET', undefined, false)).status,
        404
    );
});

test('currency summaries add decimal cents without cumulative floating error', () => {
    const money = require('../utils/money');
    assert.equal(money.sum(['0.10', '0.20']), '0.30');
    assert.equal(money.subtract('1.00', '0.90'), '0.10');
    assert.equal(money.sum(Array(100).fill('0.01')), '1.00');
    assert.equal(money.subtract('30.05', '120.10'), '-90.05');
    assert.equal(money.sum(['9999999999999.99', '0.01']), '10000000000000.00');
});
