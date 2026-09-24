const db = require('../config/database');
const h = require('../utils/http');
const { invalidateMultipleCache } = require('../utils/cacheUtils');
const clear = () =>
    invalidateMultipleCache(['project:*', 'user:*', 'admin:*', 'search:*']);
exports.list = h.wrap(async (req, res) => {
    const p = h.pagination(req.query);
    const [[count]] = await db
        .promise()
        .query('SELECT COUNT(*) AS total FROM approval');
    const [data] = await db
        .promise()
        .query(
            'SELECT * FROM approval ORDER BY ID_Approval DESC LIMIT ? OFFSET ?',
            [p.limit, p.offset]
        );
    res.json({
        data,
        pagination: {
            page: p.page,
            limit: p.limit,
            total: Number(count.total),
            pages: Math.ceil(count.total / p.limit)
        }
    });
});
exports.detail = h.wrap(async (req, res) => {
    const [rows] = await db
        .promise()
        .query('SELECT * FROM approval WHERE ID_Approval = ?', [
            h.id(req.params.id)
        ]);
    if (!rows.length) h.fail(404, 'Approval tidak ditemukan');
    res.json(rows[0]);
});
exports.save = h.wrap(async (req, res) => {
    const result = await h.transaction(async (c) => {
        let old;
        if (req.params.id) {
            const [rows] = await c.query(
                'SELECT * FROM approval WHERE ID_Approval = ?',
                [h.id(req.params.id)]
            );
            old = rows[0];
            if (!old) h.fail(404, 'Approval tidak ditemukan');
        }
        const notaId = h.id(old?.ID_Nota ?? req.body.ID_Nota);
        const [linked] = await c.query(
            'SELECT ID_Transaksi FROM nota WHERE ID_Nota = ?',
            [notaId]
        );
        if (linked.length)
            await c.query(
                'SELECT ID_Transaksi FROM transaksi WHERE ID_Transaksi = ? FOR UPDATE',
                [linked[0].ID_Transaksi]
            );
        const [notas] = await c.query(
            'SELECT * FROM nota WHERE ID_Nota = ? FOR UPDATE',
            [notaId]
        );
        if (!notas.length) h.fail(404, 'Nota tidak ditemukan');
        const [existing] = await c.query(
            'SELECT ID_Approval FROM approval WHERE ID_Nota = ? ORDER BY ID_Approval DESC FOR UPDATE',
            [notaId]
        );
        if (!old && (existing.length || notas[0].Status_Verifikasi !== 'Pending')) h.fail(409, 'Nota sudah diproses');
        if (old && existing[0]?.ID_Approval !== old.ID_Approval)
            h.fail(409, 'Hanya approval terbaru dapat diubah');
        const status = h.choice(
            req.body.Status_Approval ?? old?.Status_Approval,
            ['Approved', 'Rejected']
        );
        const date = req.body.Tanggal_Approval
            ? h.date(req.body.Tanggal_Approval)
            : new Date().toISOString().slice(0, 10);
        const record = {
            ID_Nota: notaId,
            ID_Admin: req.user.ID_User,
            Status_Approval: status,
            Tanggal_Approval: date,
            Catatan: req.body.Catatan ?? old?.Catatan ?? null
        };
        if (record.Catatan !== null && typeof record.Catatan !== 'string')
            h.fail(400, 'Catatan tidak valid');
        const [r] = old
            ? await c.query('UPDATE approval SET ? WHERE ID_Approval = ?', [
                  record,
                  old.ID_Approval
              ])
            : await c.query('INSERT INTO approval SET ?', [record]);
        await c.query(
            'UPDATE nota SET Status_Verifikasi = ?, Tanggal_Verifikasi = ? WHERE ID_Nota = ?',
            [status, date, notaId]
        );
        await h.log(c, req.user, status + ' nota ID ' + notaId);
        return { approvalId: old?.ID_Approval || r.insertId };
    });
    await clear();
    res.status(req.params.id ? 200 : 201).json(result);
});
exports.remove = h.wrap(async (req, res) => {
    await h.transaction(async (c) => {
        const [rows] = await c.query(
            'SELECT * FROM approval WHERE ID_Approval = ?',
            [h.id(req.params.id)]
        );
        if (!rows.length) h.fail(404, 'Approval tidak ditemukan');
        const old = rows[0];
        await c.query('SELECT ID_Nota FROM nota WHERE ID_Nota = ? FOR UPDATE', [
            old.ID_Nota
        ]);
        await c.query('DELETE FROM approval WHERE ID_Approval = ?', [
            old.ID_Approval
        ]);
        const [remaining] = await c.query(
            'SELECT * FROM approval WHERE ID_Nota = ? ORDER BY ID_Approval DESC LIMIT 1',
            [old.ID_Nota]
        );
        await c.query(
            'UPDATE nota SET Status_Verifikasi = ?, Tanggal_Verifikasi = ? WHERE ID_Nota = ?',
            [
                remaining[0]?.Status_Approval || 'Pending',
                remaining[0]?.Tanggal_Approval || null,
                old.ID_Nota
            ]
        );
        await h.log(c, req.user, 'Hapus approval ID ' + old.ID_Approval);
    });
    await clear();
    res.json({ message: 'Approval dihapus' });
});
