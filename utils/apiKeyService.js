const crypto = require('crypto');
const db = require('../config/database');
const digest = (value) =>
    crypto.createHash('sha256').update(value).digest('hex');
exports.generateApiKey = async (userId) => {
    const key = crypto.randomBytes(32).toString('hex');
    await db
        .promise()
        .query('UPDATE user SET API_Key = ? WHERE ID_User = ?', [
            digest(key),
            userId
        ]);
    return key;
};
exports.verifyApiKey = async (key, userId) => {
    if (typeof key !== 'string') return false;
    const [rows] = await db
        .promise()
        .query(
            "SELECT API_Key FROM user WHERE ID_User = ? AND Status = 'Active'",
            [userId]
        );
    const stored = rows[0]?.API_Key;
    if (!/^[a-f0-9]{64}$/.test(stored || '')) return false;
    return crypto.timingSafeEqual(
        Buffer.from(digest(key), 'hex'),
        Buffer.from(stored, 'hex')
    );
};
