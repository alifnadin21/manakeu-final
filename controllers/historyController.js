const db = require('../config/database');

const getRecentHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { days = 7, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const union = `SELECT 'transaction' AS kind, ID_Transaksi AS id, Tanggal_Transaksi AS tanggal,
   Jenis_Transaksi AS jenis, Jumlah AS jumlah, Keterangan AS keterangan, ID_Project AS project_id
   FROM transaksi WHERE ID_User=? AND Tanggal_Transaksi >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
   UNION ALL SELECT 'log', ID_Log, Tanggal_Aksi, NULL, NULL, Aksi, NULL
   FROM log_aktivitas WHERE ID_User=? AND Tanggal_Aksi >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`;
        const args = [userId, Number(days), userId, Number(days)];
        const [[count]] = await db
            .promise()
            .query(
                'SELECT COUNT(*) AS total FROM (' + union + ') events',
                args
            );
        const [rows] = await db
            .promise()
            .query(
                'SELECT * FROM (' +
                    union +
                    ') events ORDER BY tanggal DESC, kind, id DESC LIMIT ? OFFSET ?',
                [...args, Number(limit), offset]
            );
        res.json({
            status: 'success',
            data: {
                total_aktivitas: Number(count.total),
                page: Number(page),
                limit: Number(limit),
                period: days + ' hari terakhir',
                activities: rows
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Gagal membaca aktivitas'
        });
    }
};

const getTransactionHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const query = `
            SELECT 
                t.ID_Transaksi,
                t.Jumlah,
                t.Jenis_Transaksi,
                t.Tanggal_Transaksi,
                t.Keterangan,
                p.ID_Project,
                p.Nama_Project,
                n.ID_Nota,
                n.Status_Verifikasi as Status_Nota,
                a.Status_Approval
            FROM transaksi t
            JOIN user u ON t.ID_User = u.ID_User
            LEFT JOIN project p ON t.ID_Project = p.ID_Project
            LEFT JOIN nota n ON n.ID_Nota = (SELECT MAX(n2.ID_Nota) FROM nota n2 WHERE n2.ID_Transaksi = t.ID_Transaksi)
            LEFT JOIN approval a ON a.ID_Approval = (SELECT MAX(a2.ID_Approval) FROM approval a2 WHERE a2.ID_Nota = n.ID_Nota)
            WHERE t.ID_User = ?
            ORDER BY t.Tanggal_Transaksi DESC
            LIMIT ? OFFSET ?
        `;

        const [results] = await db
            .promise()
            .query(query, [userId, parseInt(limit), parseInt(offset)]);

        const [[count]] = await db
            .promise()
            .query(
                'SELECT COUNT(*) AS total FROM transaksi WHERE ID_User = ?',
                [userId]
            );
        return res.status(200).json({
            status: 'success',
            data: {
                total_transaksi: Number(count.total),
                page: parseInt(page),
                limit: parseInt(limit),
                transaksi: results.map((row) => ({
                    id_transaksi: row.ID_Transaksi,
                    jumlah: Number(row.Jumlah),
                    jenis: row.Jenis_Transaksi,
                    tanggal: row.Tanggal_Transaksi,
                    keterangan: row.Keterangan,
                    project: {
                        id: row.ID_Project,
                        nama_projek: row.Nama_Project
                    },
                    nota: {
                        id: row.ID_Nota,
                        status_nota: row.Status_Nota
                    },
                    approval: row.Status_Approval
                }))
            }
        });

        // Error
    } catch (error) {
        console.error('Error:', error);
        return res
            .status(500)
            .json({
                status: 'error',
                message:
                    error.status && error.status < 500
                        ? error.message
                        : 'Terjadi kesalahan pada server'
            });
    }
};

module.exports = {
    getTransactionHistory,
    getRecentHistory
};
