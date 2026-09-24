const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Resolve the current account on every request so role changes and deactivation
// take effect immediately, including for tokens issued before the change.
module.exports = async function authMiddleware(req, res, next) {
    const match = /^(?:Bearer|Token) ([^\s]+)$/i.exec(
        req.get('Authorization') || ''
    );
    if (!match)
        return res.status(401).json({ error: 'Token autentikasi diperlukan' });
    let decoded;
    try {
        decoded = jwt.verify(match[1], process.env.JWT_SECRET, {
            algorithms: ['HS256']
        });
        if (!Number.isSafeInteger(decoded.ID_User) || decoded.ID_User <= 0)
            throw new Error('Invalid subject');
    } catch {
        return res
            .status(401)
            .json({ error: 'Token tidak valid atau kedaluwarsa' });
    }
    try {
        const [users] = await db
            .promise()
            .query(
                'SELECT ID_User, Nama, Email, Role, Status FROM user WHERE ID_User = ?',
                [decoded.ID_User]
            );
        if (!users.length || users[0].Status !== 'Active') {
            return res
                .status(401)
                .json({ error: 'Akun tidak aktif atau tidak ditemukan' });
        }
        req.user = users[0];
        next();
    } catch (error) {
        next(error);
    }
};
