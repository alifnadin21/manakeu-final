const db = require('../config/database');
const bcrypt = require('bcryptjs');
const h = require('../utils/http');
const { validateNama, validatePassword } = require('../utils/validation');
const { invalidateMultipleCache } = require('../utils/cacheUtils');
const definitions = {
    project: {
        key: 'ID_Project',
        search: 'Nama_Project',
        fields: '*',
        order: 'ID_Project'
    },
    transaksi: {
        key: 'ID_Transaksi',
        search: 'Keterangan',
        fields: '*',
        order: 'Tanggal_Transaksi DESC, ID_Transaksi'
    },
    nota: {
        key: 'ID_Nota',
        search: 'File_Nota',
        fields: '*',
        order: 'ID_Nota'
    },
    user: {
        key: 'ID_User',
        search: 'Nama',
        fields: 'ID_User, Nama, Email, Role, Status, Tanggal_Buat',
        order: 'ID_User'
    },
    log_aktivitas: {
        key: 'ID_Log',
        search: 'Aksi',
        fields: '*',
        order: 'ID_Log'
    }
};
async function read(connection, table, value, user, lock = false) {
    const [rows] = await connection.query(
        'SELECT ' +
            definitions[table].fields +
            ' FROM ' +
            table +
            ' WHERE ' +
            definitions[table].key +
            ' = ?' +
            (lock ? ' FOR UPDATE' : ''),
        [h.id(value)]
    );
    return h.own(user, rows[0]);
}
async function changed() {
    await invalidateMultipleCache([
        'project:*',
        'user:*',
        'admin:*',
        'search:*'
    ]);
}
function list(table) {
    return h.wrap(async (req, res) => {
        const d = definitions[table],
            p = h.pagination(req.query),
            where = [],
            args = [];
        if (req.user.Role !== 'Admin') {
            where.push('ID_User = ?');
            args.push(req.user.ID_User);
        }
        if (req.query.search) {
            where.push(d.search + ' LIKE ?');
            args.push('%' + h.text(req.query.search, 'Search', 100) + '%');
        }
        for (const field of [
            'ID_Project',
            'Jenis_Transaksi',
            'Status',
            'Status_Verifikasi'
        ]) {
            const allowed = {
                project: ['Status'],
                transaksi: ['ID_Project', 'Jenis_Transaksi'],
                nota: ['Status_Verifikasi'],
                user: ['Status'],
                log_aktivitas: []
            }[table];
            if (allowed.includes(field) && req.query[field]) {
                where.push(field + ' = ?');
                args.push(
                    field === 'ID_Project'
                        ? h.id(req.query[field])
                        : h.text(req.query[field], field, 50)
                );
            }
        }
        if (table === 'transaksi')
            for (const [key, op] of [
                ['start_date', '>='],
                ['end_date', '<=']
            ])
                if (req.query[key]) {
                    where.push('Tanggal_Transaksi ' + op + ' ?');
                    args.push(h.date(req.query[key]));
                }
        const clause = where.length ? ' WHERE ' + where.join(' AND ') : '';
        const [[count]] = await db
            .promise()
            .query('SELECT COUNT(*) AS total FROM ' + table + clause, args);
        const [rows] = await db
            .promise()
            .query(
                'SELECT ' +
                    d.fields +
                    ' FROM ' +
                    table +
                    clause +
                    ' ORDER BY ' +
                    d.order +
                    ' DESC LIMIT ? OFFSET ?',
                [...args, p.limit, p.offset]
            );
        res.json({
            data: rows,
            pagination: {
                page: p.page,
                limit: p.limit,
                total: Number(count.total),
                pages: Math.ceil(count.total / p.limit)
            }
        });
    });
}
function detail(table) {
    return h.wrap(async (req, res) =>
        res.json(await read(db.promise(), table, req.params.id, req.user))
    );
}
function projectData(body, old = {}) {
    const data = { ...old, ...body };
    const result = {
        Nama_Project: h.text(data.Nama_Project, 'Nama project'),
        Deskripsi:
            data.Deskripsi == null || data.Deskripsi === ''
                ? null
                : h.text(data.Deskripsi, 'Deskripsi', 10000),
        Status: h.choice(data.Status, ['Active', 'Deactive'])
    };
    result.Deskripsi = data.Deskripsi === '' ? null : result.Deskripsi;
    for (const key of ['Tanggal_Mulai', 'Tanggal_Selesai'])
        result[key] = data[key] ? h.date(data[key]) : null;
    if (
        result.Tanggal_Mulai &&
        result.Tanggal_Selesai &&
        result.Tanggal_Mulai > result.Tanggal_Selesai
    )
        h.fail(400, 'Tanggal selesai harus setelah tanggal mulai');
    return result;
}
function transactionData(body, old = {}) {
    const data = { ...old, ...body };
    return {
        ID_Project: h.id(data.ID_Project),
        Jenis_Transaksi: h.choice(data.Jenis_Transaksi, [
            'Pemasukan',
            'Pengeluaran'
        ]),
        Jumlah: h.amount(data.Jumlah),
        Tanggal_Transaksi: h.date(data.Tanggal_Transaksi),
        Keterangan:
            data.Keterangan == null || data.Keterangan === ''
                ? null
                : h.text(data.Keterangan, 'Keterangan', 10000)
    };
}
exports.list = list;
exports.detail = detail;
exports.saveProject = h.wrap(async (req, res) => {
    const result = await h.transaction(async (c) => {
        const old = req.params.id
            ? await read(c, 'project', req.params.id, req.user, true)
            : {};
        const data = projectData(req.body, old);
        const [r] = req.params.id
            ? await c.query('UPDATE project SET ? WHERE ID_Project = ?', [
                  data,
                  old.ID_Project
              ])
            : await c.query('INSERT INTO project SET ?', [
                  { ...data, ID_User: req.user.ID_User }
              ]);
        const projectId = old.ID_Project || r.insertId;
        await h.log(c, req.user, 'Simpan project ID ' + projectId);
        return { projectId };
    });
    await changed();
    res.status(req.params.id ? 200 : 201).json(result);
});
exports.saveTransaction = h.wrap(async (req, res) => {
    const result = await h.transaction(async (c) => {
        const old = req.params.id
            ? await read(c, 'transaksi', req.params.id, req.user, true)
            : {};
        const data = transactionData(req.body, old);
        await read(c, 'project', data.ID_Project, req.user, true);
        if (old.ID_Transaksi) {
            const [approved] = await c.query(
                "SELECT ID_Nota FROM nota WHERE ID_Transaksi = ? AND Status_Verifikasi = 'Approved'",
                [old.ID_Transaksi]
            );
            if (approved.length)
                h.fail(
                    409,
                    'Nota approved harus direvisi sebelum transaksi diubah'
                );
            const [payments] = await c.query(
                'SELECT ID_Payment FROM Payments WHERE ID_Transaksi = ? LIMIT 1',
                [old.ID_Transaksi]
            );
            if (payments.length)
                h.fail(
                    409,
                    'Transaksi terhubung ke pembayaran; gunakan koreksi terpisah'
                );
        }
        const [r] = req.params.id
            ? await c.query('UPDATE transaksi SET ? WHERE ID_Transaksi = ?', [
                  data,
                  old.ID_Transaksi
              ])
            : await c.query('INSERT INTO transaksi SET ?', [
                  { ...data, ID_User: req.user.ID_User }
              ]);
        const transaksiId = old.ID_Transaksi || r.insertId;
        await h.log(c, req.user, 'Simpan transaksi ID ' + transaksiId);
        return { transaksiId };
    });
    await changed();
    res.status(req.params.id ? 200 : 201).json(result);
});
exports.saveNota = h.wrap(async (req, res) => {
    const result = await h.transaction(async (c) => {
        const old = req.params.id
            ? await read(c, 'nota', req.params.id, req.user, true)
            : {};
        if (old.Status_Verifikasi === 'Approved')
            h.fail(409, 'Nota approved harus direvisi terlebih dahulu');
        if (
            (req.body.Status_Verifikasi &&
                req.body.Status_Verifikasi !== 'Pending') ||
            req.body.Tanggal_Verifikasi
        )
            h.fail(400, 'Gunakan endpoint approval untuk verifikasi');
        const data = { ...old, ...req.body };
        await read(c, 'transaksi', data.ID_Transaksi, req.user, true);
        const record = {
            ID_Transaksi: h.id(data.ID_Transaksi),
            File_Nota: h.text(data.File_Nota, 'File nota'),
            Tanggal_Unggah: h.date(data.Tanggal_Unggah),
            Status_Verifikasi: 'Pending',
            Tanggal_Verifikasi: null
        };
        if (old.ID_Nota)
            await c.query('DELETE FROM approval WHERE ID_Nota = ?', [
                old.ID_Nota
            ]);
        const [r] = old.ID_Nota
            ? await c.query('UPDATE nota SET ? WHERE ID_Nota = ?', [
                  record,
                  old.ID_Nota
              ])
            : await c.query('INSERT INTO nota SET ?', [
                  { ...record, ID_User: req.user.ID_User }
              ]);
        const notaId = old.ID_Nota || r.insertId;
        await h.log(c, req.user, 'Simpan nota ID ' + notaId);
        return { notaId };
    });
    await changed();
    res.status(req.params.id ? 200 : 201).json(result);
});
exports.saveUser = h.wrap(async (req, res) => {
    const result = await h.transaction(async (c) => {
        const old =
            req.method === 'PUT'
                ? await read(c, 'user', req.params.id, req.user, true)
                : {};
        const data = { ...old, ...req.body };
        const nameError = validateNama(data.Nama);
        if (nameError) h.fail(400, nameError);
        const email = h.text(data.Email, 'Email').toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            h.fail(400, 'Email tidak valid');
        const record = {
            Nama: data.Nama,
            Email: email,
            Role: h.choice(data.Role, ['Admin', 'User']),
            Status: h.choice(data.Status || 'Active', ['Active', 'Inactive'])
        };
        if (
            old.ID_User === req.user.ID_User &&
            (record.Role !== 'Admin' || record.Status !== 'Active')
        )
            h.fail(
                409,
                'Admin tidak dapat menonaktifkan atau menurunkan peran sendiri'
            );
        if (!old.ID_User || req.body.Password) {
            const error = validatePassword(req.body.Password);
            if (error) h.fail(400, error);
            record.Password = await bcrypt.hash(req.body.Password, 12);
        }
        const [r] = old.ID_User
            ? await c.query('UPDATE user SET ? WHERE ID_User = ?', [
                  record,
                  old.ID_User
              ])
            : await c.query('INSERT INTO user SET ?', [record]);
        const userId = old.ID_User || r.insertId;
        await h.log(c, req.user, 'Simpan user ID ' + userId);
        return { userId };
    });
    await changed();
    res.status(req.method === 'PUT' ? 200 : 201).json(result);
});
exports.remove = (table) =>
    h.wrap(async (req, res) => {
        await h.transaction(async (c) => {
            const old = await read(c, table, req.params.id, req.user, true);
            if (table === 'user') {
                if (old.ID_User === req.user.ID_User)
                    h.fail(409, 'Tidak dapat menghapus akun sendiri');
                await c.query(
                    "UPDATE user SET Status = 'Inactive' WHERE ID_User = ?",
                    [old.ID_User]
                );
            } else {
                if (table === 'project') {
                    const [rows] = await c.query(
                        'SELECT ID_Transaksi FROM transaksi WHERE ID_Project = ? LIMIT 1',
                        [old.ID_Project]
                    );
                    if (rows.length)
                        h.fail(
                            409,
                            'Project memiliki transaksi; gunakan status Deactive'
                        );
                }
                if (table === 'transaksi') {
                    const [rows] = await c.query(
                        'SELECT ID_Nota FROM nota WHERE ID_Transaksi = ? LIMIT 1',
                        [old.ID_Transaksi]
                    );
                    if (rows.length) h.fail(409, 'Transaksi memiliki nota');
                    const [payments] = await c.query(
                        'SELECT ID_Payment FROM Payments WHERE ID_Transaksi = ? LIMIT 1',
                        [old.ID_Transaksi]
                    );
                    if (payments.length)
                        h.fail(409, 'Transaksi memiliki pembayaran');
                }
                if (table === 'nota' && old.Status_Verifikasi === 'Approved')
                    h.fail(409, 'Nota approved harus direvisi terlebih dahulu');
                await c.query(
                    'DELETE FROM ' +
                        table +
                        ' WHERE ' +
                        definitions[table].key +
                        ' = ?',
                    [req.params.id]
                );
            }
            await h.log(
                c,
                req.user,
                'Hapus/nonaktifkan ' + table + ' ID ' + req.params.id
            );
        });
        await changed();
        res.json({ message: 'Data berhasil dihapus atau dinonaktifkan' });
    });
exports.createLog = h.wrap(async (req, res) => {
    const [r] = await db
        .promise()
        .query('INSERT INTO log_aktivitas (ID_User,Aksi) VALUES (?,?)', [
            req.user.ID_User,
            h.text(req.body.Aksi, 'Aksi', 2000)
        ]);
    await changed();
    res.status(201).json({ logId: r.insertId });
});
