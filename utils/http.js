const db = require('../config/database');
const wrap = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
const fail = (status, message) => {
    const error = new Error(message);
    error.status = status;
    throw error;
};
const id = (value) => {
    if (
        !['string', 'number'].includes(typeof value) ||
        !/^[1-9]\d*$/.test(String(value)) ||
        !Number.isSafeInteger(Number(value))
    )
        fail(400, 'ID tidak valid');
    return Number(value);
};
const text = (value, name, max = 255) => {
    if (typeof value !== 'string' || !value.trim() || value.length > max)
        fail(400, name + ' tidak valid');
    return value.trim();
};
const date = (value) => {
    if (
        typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(Date.parse(value)) ||
        new Date(value).toISOString().slice(0, 10) !== value
    )
        fail(400, 'Tanggal tidak valid');
    return value;
};
const amount = (value) => {
    if (
        !['string', 'number'].includes(typeof value) ||
        !/^(?:0|[1-9]\d{0,12})(?:\.\d{1,2})?$/.test(String(value)) ||
        Number(value) <= 0
    )
        fail(400, 'Jumlah harus positif dengan maksimal 2 desimal');
    return String(value);
};
const choice = (value, choices) => {
    if (!choices.includes(value)) fail(400, 'Pilihan tidak valid');
    return value;
};
const pagination = (query) => {
    const page = id(query.page || 1);
    const limit = id(query.limit || 20);
    if (limit > 100 || page > 1000000) fail(400, 'Pagination tidak valid');
    return { page, limit, offset: (page - 1) * limit };
};
const own = (user, row) => {
    if (!row) fail(404, 'Data tidak ditemukan');
    if (user.Role !== 'Admin' && Number(row.ID_User) !== user.ID_User)
        fail(403, 'Akses ditolak');
    return row;
};
async function transaction(work) {
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();
        const value = await work(connection);
        await connection.commit();
        return value;
    } catch (error) {
        await connection.rollback().catch(() => {});
        throw error;
    } finally {
        connection.release();
    }
}
const log = (connection, user, action) =>
    connection.query(
        'INSERT INTO log_aktivitas (ID_User, Aksi) VALUES (?, ?)',
        [user.ID_User, action]
    );
module.exports = {
    wrap,
    fail,
    id,
    text,
    date,
    amount,
    choice,
    pagination,
    own,
    transaction,
    log
};
