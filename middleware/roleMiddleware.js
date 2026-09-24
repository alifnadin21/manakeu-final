// middleware/roleMiddleware.js
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Tidak diizinkan - Data pengguna tidak ditemukan'
        });
    }

    if (req.user.Role !== 'Admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Akses ditolak - Anda bukan Admin!'
        });
    }

    next();
};

module.exports = { isAdmin };
