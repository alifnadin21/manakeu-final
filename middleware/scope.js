const db = require('../config/database');
const h = require('../utils/http');
const project = h.wrap(async (req, res, next) => {
    const ids = [
        req.params.projectId,
        req.body?.project_id,
        req.body?.source_project_id,
        req.body?.target_project_id
    ].filter((v) => v !== undefined);
    for (const value of ids) {
        const [rows] = await db
            .promise()
            .query('SELECT ID_User FROM project WHERE ID_Project = ?', [
                h.id(value)
            ]);
        h.own(req.user, rows[0]);
    }
    next();
});
const user = h.wrap(async (req, res, next) => {
    const value = req.params.userId ?? req.body?.user_id;
    if (
        value !== undefined &&
        req.user.Role !== 'Admin' &&
        h.id(value) !== req.user.ID_User
    )
        h.fail(403, 'Akses ditolak');
    next();
});
const validate = h.wrap(async (req, res, next) => {
    h.pagination(req.query);
    const required =
        {
            '/batch-transaction': ['project_id', 'transactions'],
            '/transfer-project': [
                'source_project_id',
                'target_project_id',
                'transaction_ids'
            ],
            '/project-budget-adjustment': ['project_id', 'adjustments'],
            '/bulk-nota-approval': ['nota_ids', 'status'],
            '/nota-revision-request': ['nota_ids', 'catatan_revisi'],
            '/project-summary-report': ['project_id', 'start_date', 'end_date'],
            '/project-transaction-analysis': ['project_id', 'period'],
            '/user-activity-report': ['user_id', 'start_date', 'end_date']
        }[req.path] || [];
    for (const key of required)
        if (
            req.body?.[key] === undefined ||
            req.body[key] === null ||
            req.body[key] === ''
        )
            h.fail(400, key + ' diperlukan');
    for (const key of [
        'project_id',
        'source_project_id',
        'target_project_id',
        'user_id'
    ])
        if (req.body?.[key] !== undefined) h.id(req.body[key]);
    if (
        req.body?.source_project_id !== undefined &&
        Number(req.body.source_project_id) ===
            Number(req.body.target_project_id)
    )
        h.fail(400, 'Project sumber dan tujuan harus berbeda');
    if (req.body?.catatan_revisi)
        h.text(req.body.catatan_revisi, 'Catatan revisi', 2000);
    for (const key of ['month', 'year', 'days'])
        if (req.query[key] !== undefined) {
            const n = h.id(req.query[key]);
            if (
                (key === 'month' && n > 12) ||
                (key === 'year' && (n < 1000 || n > 9999)) ||
                (key === 'days' && n > 3650)
            )
                h.fail(400, 'Periode tidak valid');
        }
    for (const key of ['start_date', 'end_date', 'deadline'])
        if (req.body?.[key]) h.date(req.body[key]);
    if (req.body?.start_date > req.body?.end_date)
        h.fail(400, 'Periode tidak valid');
    if (req.body?.period)
        h.choice(req.body.period, ['daily', 'weekly', 'monthly']);
    if (req.query.status)
        h.choice(req.query.status, ['Pending', 'Approved', 'Rejected']);
    if (req.body?.status) h.choice(req.body.status, ['Approved', 'Rejected']);
    for (const key of [
        'transactions',
        'adjustments',
        'nota_ids',
        'transaction_ids'
    ])
        if (req.body?.[key] !== undefined) {
            const items = req.body[key];
            if (!Array.isArray(items) || !items.length || items.length > 100)
                h.fail(400, 'Array harus berisi 1-100 item');
            if (key.endsWith('_ids')) {
                items.forEach(h.id);
                if (new Set(items.map(Number)).size !== items.length)
                    h.fail(400, 'ID duplikat');
            }
            for (const item of items) {
                if (key === 'transactions') {
                    if (!item || typeof item !== 'object')
                        h.fail(400, 'Transaksi tidak valid');
                    h.amount(item.jumlah);
                    h.choice(item.jenis_transaksi, [
                        'Pemasukan',
                        'Pengeluaran'
                    ]);
                    if (item.tanggal) h.date(item.tanggal);
                }
                if (key === 'adjustments') {
                    if (!item || typeof item !== 'object')
                        h.fail(400, 'Adjustment tidak valid');
                    h.id(item.transaksi_id);
                    h.amount(item.jumlah_baru);
                    h.text(item.keterangan, 'Keterangan', 2000);
                }
            }
        }
    next();
});
module.exports = { project, user, validate };
