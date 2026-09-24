const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
// This suite creates and drops ONLY its own random database. Existing data is never imported.
test(
    'real MySQL financial workflows',
    { skip: process.env.RUN_DB_TESTS !== '1' },
    async (t) => {
        require('dotenv').config();
        const mysql = require('mysql2/promise');
        const database =
            'manakeu_test_' + crypto.randomBytes(8).toString('hex');
        const admin = await mysql.createConnection({
            host: process.env.TEST_DB_HOST || '127.0.0.1',
            port: Number(process.env.TEST_DB_PORT || 3306),
            user: process.env.TEST_DB_USER || 'root',
            password: process.env.TEST_DB_PASSWORD || '',
            multipleStatements: true
        });
        let server, db;
        try {
            await admin.query(
                'CREATE DATABASE ' + database + ' CHARACTER SET utf8mb4'
            );
            await admin.query('USE ' + database);
            const dump = fs.readFileSync(
                require.resolve('../dbase_manakeu.sql'),
                'utf8'
            );
            const statements = dump
                .replace(/^--.*$/gm, '')
                .match(
                    /(?:CREATE TABLE(?: IF NOT EXISTS)?|ALTER TABLE) [\s\S]*?;/g
                );
            assert.ok(statements.length > 10);
            for (const sql of statements) await admin.query(sql);
            await admin.query(
                fs.readFileSync(
                    require.resolve('../migrations/001_api_key.sql'),
                    'utf8'
                )
            );
            Object.assign(process.env, {
                NODE_ENV: 'test',
                DB_HOST: process.env.TEST_DB_HOST || '127.0.0.1',
                DB_PORT: process.env.TEST_DB_PORT || '3306',
                DB_USER: process.env.TEST_DB_USER || 'root',
                DB_PASSWORD: process.env.TEST_DB_PASSWORD || '',
                DB_NAME: database,
                JWT_SECRET: 'integration-secret-'.repeat(3),
                REDIS_ENABLED: 'false',
                WHATSAPP_ENABLED: 'false',
                GOOGLE_CLIENT_ID: '',
                GOOGLE_CLIENT_SECRET: ''
            });
            const app = require('../app');
            db = require('../config/database');
            server = app.listen(0, '127.0.0.1');
            await new Promise((resolve) => server.once('listening', resolve));
            const base = 'http://127.0.0.1:' + server.address().port;
            async function request(path, method = 'GET', body, token) {
                const r = await fetch(base + path, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: 'Bearer ' + token } : {})
                    },
                    body: body === undefined ? undefined : JSON.stringify(body)
                });
                return { status: r.status, body: await r.json() };
            }
            const bcrypt = require('bcryptjs');
            const password = 'Secure123';
            const [owner] = await admin.query(
                "INSERT INTO user (Nama,Email,Password,Role,Status) VALUES (?,?,?,'Admin','Active')",
                [
                    'Test Admin',
                    'admin@example.com',
                    await bcrypt.hash(password, 4)
                ]
            );
            let adminToken, userToken, userId, projectId, transactionId, notaId;
            await t.test(
                'authentication, registration and real roles',
                async () => {
                    let r = await request('/api/auth/register', 'POST', {
                        Nama: 'Test Member',
                        Email: 'member@example.com',
                        Password: password
                    });
                    assert.equal(r.status, 201, JSON.stringify(r.body));
                    userId = r.body.user.ID_User;
                    r = await request('/api/auth/login', 'POST', {
                        Email: 'member@example.com',
                        Password: password
                    });
                    assert.equal(r.status, 200);
                    userToken = r.body.token;
                    r = await request('/api/auth/login', 'POST', {
                        Email: 'admin@example.com',
                        Password: password
                    });
                    assert.equal(r.status, 200);
                    adminToken = r.body.token;
                    assert.equal(
                        (
                            await request(
                                '/api/users',
                                'GET',
                                undefined,
                                userToken
                            )
                        ).status,
                        403
                    );
                }
            );
            await t.test('project CRUD and ownership', async () => {
                const r = await request(
                    '/api/projects',
                    'POST',
                    {
                        Nama_Project: 'Accounting test',
                        Status: 'Active',
                        Tanggal_Mulai: '2026-01-01'
                    },
                    userToken
                );
                assert.equal(r.status, 201, JSON.stringify(r.body));
                projectId = r.body.projectId;
                assert.equal(
                    (
                        await request(
                            '/api/projects/' + projectId,
                            'PUT',
                            { Deskripsi: 'Updated' },
                            userToken
                        )
                    ).status,
                    200
                );
                const detail = await request(
                    '/api/projects/' + projectId,
                    'GET',
                    undefined,
                    userToken
                );
                assert.equal(detail.body.ID_User, userId);
            });
            await t.test('income, expense and multiple receipts', async () => {
                let r = await request(
                    '/api/transaksi',
                    'POST',
                    {
                        ID_Project: projectId,
                        Jenis_Transaksi: 'Pemasukan',
                        Jumlah: '100.10',
                        Tanggal_Transaksi: '2026-09-01'
                    },
                    userToken
                );
                assert.equal(r.status, 201, JSON.stringify(r.body));
                transactionId = r.body.transaksiId;
                r = await request(
                    '/api/transaksi',
                    'POST',
                    {
                        ID_Project: projectId,
                        Jenis_Transaksi: 'Pengeluaran',
                        Jumlah: '30.05',
                        Tanggal_Transaksi: '2026-09-02'
                    },
                    userToken
                );
                assert.equal(r.status, 201);
                for (const file of ['receipt-one.pdf', 'receipt-two.pdf']) {
                    r = await request(
                        '/api/nota',
                        'POST',
                        {
                            ID_Transaksi: transactionId,
                            File_Nota: file,
                            Tanggal_Unggah: '2026-09-02'
                        },
                        userToken
                    );
                    assert.equal(r.status, 201, JSON.stringify(r.body));
                    notaId = r.body.notaId;
                }
            });
            await t.test(
                'reports count each transaction once despite multiple receipts',
                async () => {
                    const r = await request(
                        '/api/complex/project-summary-report',
                        'POST',
                        {
                            project_id: projectId,
                            start_date: '2026-09-01',
                            end_date: '2026-09-30'
                        },
                        userToken
                    );
                    assert.equal(r.status, 200, JSON.stringify(r.body));
                    assert.equal(
                        Number(r.body.data.summary.Total_Pemasukan),
                        100.1
                    );
                    assert.equal(
                        Number(r.body.data.summary.Total_Pengeluaran),
                        30.05
                    );
                    assert.equal(
                        Number(r.body.data.summary.Total_Transaksi),
                        2
                    );
                    assert.equal(Number(r.body.data.summary.Total_Nota), 2);
                    assert.equal(r.body.data.transactions.length, 2);
                    const monthly = await request(
                        '/api/complex/project-monthly?year=2026&month=10',
                        'GET',
                        undefined,
                        userToken
                    );
                    assert.equal(monthly.status, 200);
                    assert.equal(monthly.body.data.projects.length, 1);
                    assert.equal(monthly.body.data.summary.total_transaksi, 0);
                }
            );
            await t.test(
                'batch failure rolls back earlier successful inserts',
                async () => {
                    const [[before]] = await admin.query(
                        'SELECT COUNT(*) AS count FROM transaksi'
                    );
                    const r = await request(
                        '/api/complex/batch-transaction',
                        'POST',
                        {
                            project_id: projectId,
                            transactions: [
                                {
                                    jenis_transaksi: 'Pemasukan',
                                    jumlah: 10,
                                    tanggal: '2026-09-03',
                                    keterangan: 'valid'
                                },
                                {
                                    jenis_transaksi: 'Pengeluaran',
                                    jumlah: 20,
                                    tanggal: '2026-09-03',
                                    nota_file: 'x'.repeat(300)
                                }
                            ]
                        },
                        userToken
                    );
                    assert.equal(r.status, 500);
                    const [[after]] = await admin.query(
                        'SELECT COUNT(*) AS count FROM transaksi'
                    );
                    assert.equal(after.count, before.count);
                }
            );
            await t.test(
                'budget adjustment validates amounts and updates real ledger',
                async () => {
                    const r = await request(
                        '/api/complex/project-budget-adjustment',
                        'PUT',
                        {
                            project_id: projectId,
                            adjustments: [
                                {
                                    transaksi_id: transactionId,
                                    jumlah_baru: '120.10',
                                    keterangan: 'Correction'
                                }
                            ]
                        },
                        userToken
                    );
                    assert.equal(r.status, 200, JSON.stringify(r.body));
                    const [[row]] = await admin.query(
                        'SELECT Jumlah,Keterangan FROM transaksi WHERE ID_Transaksi = ?',
                        [transactionId]
                    );
                    assert.equal(row.Jumlah, '120.10');
                    assert.match(row.Keterangan, /Correction/);
                }
            );
            await t.test(
                'approval is atomic, duplicate-safe and reversible',
                async () => {
                    const payload = {
                        ID_Nota: notaId,
                        Status_Approval: 'Approved',
                        ID_Admin: userId
                    };
                    const results = await Promise.all([
                        request(
                            '/api/approval/approve',
                            'POST',
                            payload,
                            adminToken
                        ),
                        request(
                            '/api/approval/approve',
                            'POST',
                            payload,
                            adminToken
                        )
                    ]);
                    assert.deepEqual(
                        results.map((r) => r.status).sort(),
                        [201, 409]
                    );
                    const created = results.find((r) => r.status === 201);
                    const [[a]] = await admin.query(
                        'SELECT * FROM approval WHERE ID_Approval = ?',
                        [created.body.approvalId]
                    );
                    assert.equal(a.ID_Admin, owner.insertId);
                    assert.equal(
                        (
                            await request(
                                '/api/transaksi/' + transactionId,
                                'PUT',
                                { Jumlah: 200 },
                                userToken
                            )
                        ).status,
                        409
                    );
                    assert.equal(
                        (
                            await request(
                                '/api/approval/' + a.ID_Approval,
                                'DELETE',
                                undefined,
                                adminToken
                            )
                        ).status,
                        200
                    );
                    const [[nota]] = await admin.query(
                        'SELECT Status_Verifikasi FROM nota WHERE ID_Nota = ?',
                        [notaId]
                    );
                    assert.equal(nota.Status_Verifikasi, 'Pending');
                }
            );
            await t.test(
                'search pagination logs dashboard and API-key persistence',
                async () => {
                    const list = await request(
                        '/api/transaksi?page=1&limit=1&Jenis_Transaksi=Pemasukan',
                        'GET',
                        undefined,
                        userToken
                    );
                    assert.equal(list.status, 200);
                    assert.equal(list.body.pagination.total, 1);
                    assert.equal(list.body.data.length, 1);
                    const dash = await request(
                        '/api/redis/user/dashboard/' + userId,
                        'GET',
                        undefined,
                        userToken
                    );
                    assert.equal(dash.status, 200, JSON.stringify(dash.body));
                    assert.equal(dash.body.data.transactions.balance, 90.05);
                    assert.equal(
                        (
                            await request(
                                '/api/logs',
                                'GET',
                                undefined,
                                userToken
                            )
                        ).status,
                        200
                    );
                    const key = await request(
                        '/api/auth/api-key',
                        'POST',
                        {},
                        userToken
                    );
                    assert.equal(key.status, 200);
                    const [[saved]] = await admin.query(
                        'SELECT API_Key FROM user WHERE ID_User = ?',
                        [userId]
                    );
                    assert.notEqual(saved.API_Key, key.body.apiKey);
                    assert.equal(
                        (
                            await request(
                                '/api/redis/search?query=Accounting',
                                'GET',
                                undefined,
                                userToken
                            )
                        ).body.data.results.projects.length,
                        1
                    );
                }
            );
            await t.test(
                'deactivation immediately revokes old JWT',
                async () => {
                    assert.equal(
                        (
                            await request(
                                '/api/users/' + userId,
                                'PUT',
                                { Status: 'Inactive' },
                                adminToken
                            )
                        ).status,
                        200
                    );
                    assert.equal(
                        (
                            await request(
                                '/api/auth/me',
                                'GET',
                                undefined,
                                userToken
                            )
                        ).status,
                        401
                    );
                }
            );
        } finally {
            if (server) await new Promise((resolve) => server.close(resolve));
            if (db) await db.promise().end();
            const redisPath = require.resolve('../config/redis');
            if (require.cache[redisPath])
                require.cache[redisPath].exports.disconnect();
            if (!/^manakeu_test_[a-f0-9]{16}$/.test(database))
                throw new Error('Unsafe test database name');
            await admin.query('DROP DATABASE IF EXISTS ' + database);
            await admin.end();
        }
    }
);
