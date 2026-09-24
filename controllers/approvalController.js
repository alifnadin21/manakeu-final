const db = require('../config/database');
const { invalidateMultipleCache } = require('../utils/cacheUtils');

const bulkNotaApproval = async (req, res) => {
    let connection;
    try {
        connection = await db.promise().getConnection();
        const { nota_ids, status, catatan } = req.body;

        if (!nota_ids || !Array.isArray(nota_ids) || !status) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid input. Nota IDs dan status diperlukan'
            });
        }

        await connection.query('START TRANSACTION');

        const results = [];
        for (const notaId of [...nota_ids].sort((a, b) => a - b)) {
            const [linked] = await connection.query(
                'SELECT ID_Transaksi FROM nota WHERE ID_Nota = ?',
                [notaId]
            );
            if (linked.length)
                await connection.query(
                    'SELECT ID_Transaksi FROM transaksi WHERE ID_Transaksi = ? FOR UPDATE',
                    [linked[0].ID_Transaksi]
                );
            const [notas] = await connection.query(
                'SELECT ID_Nota, Status_Verifikasi FROM nota WHERE ID_Nota = ? FOR UPDATE',
                [notaId]
            );
            if (!notas.length) {
                const error = new Error('Nota tidak ditemukan');
                error.status = 404;
                throw error;
            }
            if (notas[0].Status_Verifikasi !== 'Pending') {
                const error = new Error('Nota sudah diproses');
                error.status = 409;
                throw error;
            }
            // 1. Update status nota
            await connection.query(
                `UPDATE nota 
                SET Status_Verifikasi = ?, Tanggal_Verifikasi = NOW() 
                WHERE ID_Nota = ?`,
                [status, notaId]
            );

            // 2. Buat approval record
            const [approvalResult] = await connection.query(
                `INSERT INTO approval (ID_Nota, ID_Admin, Status_Approval, Tanggal_Approval, Catatan) 
                VALUES (?, ?, ?, NOW(), ?)`,
                [notaId, req.user.ID_User, status, catatan || null]
            );

            // 3. Log aktivitas
            await connection.query(
                `INSERT INTO log_aktivitas (ID_User, Aksi, Tanggal_Aksi) 
                VALUES (?, ?, NOW())`,
                [req.user.ID_User, `${status} nota ID ${notaId}`]
            );

            results.push({
                nota_id: notaId,
                approval_id: approvalResult.insertId,
                status
            });
        }

        // Tambahan: Invalidate related caches
        await connection.query('COMMIT');
        await invalidateMultipleCache([
            'project:*',
            'user:*',
            'admin:*',
            'search:*'
        ]);

        return res.status(200).json({
            status: 'success',
            message: `Berhasil memproses ${results.length} nota`,
            data: results
        });
    } catch (error) {
        if (connection) await connection.query('ROLLBACK').catch(() => {});
        console.error('Error in bulk nota approval:', error);
        return res.status(error.status || 500).json({
            status: 'error',
            message:
                error.status && error.status < 500
                    ? error.message
                    : 'Terjadi kesalahan pada server'
        });
    } finally {
        if (connection) connection.release();
    }
};

const getApprovalStats = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.ID_User,
                u.Nama as Nama_Admin,
                COUNT(a.ID_Approval) as Total_Approval,
                SUM(CASE WHEN a.Status_Approval = 'Approved' THEN 1 ELSE 0 END) as Total_Approved,
                SUM(CASE WHEN a.Status_Approval = 'Rejected' THEN 1 ELSE 0 END) as Total_Rejected,
                COUNT(DISTINCT n.ID_Transaksi) as Total_Transaksi_Diproses,
                COUNT(DISTINCT t.ID_Project) as Total_Project_Ditangani
            FROM user u
            LEFT JOIN approval a ON u.ID_User = a.ID_Admin
            LEFT JOIN nota n ON a.ID_Nota = n.ID_Nota
            LEFT JOIN transaksi t ON n.ID_Transaksi = t.ID_Transaksi
            WHERE u.Role = 'Admin'
            GROUP BY u.ID_User, u.Nama
            ORDER BY Total_Approval DESC`;

        const [results] = await db.promise().query(query);

        return res.status(200).json({
            status: 'success',
            data: {
                total_admin: results.length,
                admin_stats: results.map((row) => ({
                    id_admin: row.ID_User,
                    nama_admin: row.Nama_Admin,
                    statistik: {
                        total_approval: Number(row.Total_Approval),
                        approved: Number(row.Total_Approved),
                        rejected: Number(row.Total_Rejected),
                        transaksi_diproses: Number(
                            row.Total_Transaksi_Diproses
                        ),
                        project_ditangani: Number(row.Total_Project_Ditangani)
                    }
                }))
            }
        });
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
    getApprovalStats,
    bulkNotaApproval
};
