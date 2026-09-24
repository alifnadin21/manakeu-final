const money = require('../utils/money');
const db = require('../config/database');
const { invalidateMultipleCache } = require('../utils/cacheUtils');

const projectBudgetAdjustment = async (req, res) => {
    let connection;
    try {
        connection = await db.promise().getConnection();
        const { project_id, adjustments } = req.body;
        if (!project_id || !adjustments || !Array.isArray(adjustments)) {
            return res.status(400).json({
                status: 'error',
                message:
                    'Invalid input. Project ID dan array adjustment diperlukan'
            });
        }

        await connection.query('START TRANSACTION');

        const results = [];
        for (const adj of adjustments) {
            const { transaksi_id, jumlah_baru, keterangan } = adj;

            const [rows] = await connection.query(
                'SELECT ID_Transaksi FROM transaksi WHERE ID_Transaksi = ? AND ID_Project = ? FOR UPDATE',
                [transaksi_id, project_id]
            );
            if (!rows.length) {
                const error = new Error('Transaksi tidak ditemukan');
                error.status = 404;
                throw error;
            }
            const [approved] = await connection.query(
                "SELECT ID_Nota FROM nota WHERE ID_Transaksi = ? AND Status_Verifikasi = 'Approved'",
                [transaksi_id]
            );
            if (approved.length) {
                const error = new Error('Nota approved harus direvisi dahulu');
                error.status = 409;
                throw error;
            }
            const [payments] = await connection.query(
                'SELECT ID_Payment FROM Payments WHERE ID_Transaksi = ? LIMIT 1',
                [transaksi_id]
            );
            if (payments.length) {
                const error = new Error('Transaksi memiliki pembayaran');
                error.status = 409;
                throw error;
            }
            // 1. Update jumlah transaksi
            const [updateResult] = await connection.query(
                `UPDATE transaksi 
                SET Jumlah = ?, Keterangan = CONCAT(COALESCE(Keterangan, ''), ' [Adjusted: ', ?, ']') 
                WHERE ID_Transaksi = ? AND ID_Project = ?`,
                [jumlah_baru, keterangan, transaksi_id, project_id]
            );

            if (!updateResult.affectedRows) {
                const error = new Error(
                    'Transaksi tidak ditemukan pada project'
                );
                error.status = 404;
                throw error;
            }
            // 2. Log perubahan
            await connection.query(
                `INSERT INTO log_aktivitas (ID_User, Aksi, Tanggal_Aksi) 
                VALUES (?, ?, NOW())`,
                [
                    req.user.ID_User,
                    `Adjustment budget transaksi ID ${transaksi_id} menjadi ${jumlah_baru}`
                ]
            );

            results.push({
                transaksi_id,
                jumlah_baru,
                updated: updateResult.affectedRows > 0
            });
        }

        // Tambahan: Invalidate cache setelah adjustment
        await connection.query('COMMIT');
        await invalidateMultipleCache([
            'project:*',
            'user:*',
            'admin:*',
            'search:*'
        ]);

        return res.status(200).json({
            status: 'success',
            message: `Berhasil mengupdate ${results.filter((r) => r.updated).length} transaksi`,
            data: results
        });

        //Error
    } catch (error) {
        if (connection) await connection.query('ROLLBACK').catch(() => {});
        console.error('Terdapat error saat Adjusment:', error);
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

const getProjectMonthly = async (req, res) => {
    try {
        const year = req.query.year || new Date().getFullYear();
        const month = req.query.month || new Date().getMonth() + 1;

        // QUERY
        const query = `
            SELECT 
                p.ID_Project,
                p.Nama_Project,
                p.Status as Status_Project,
                COUNT(t.ID_Transaksi) as Total_Transaksi,
                COALESCE(SUM(CASE 
                    WHEN t.Jenis_Transaksi = 'Pemasukan' THEN t.Jumlah 
                    ELSE 0 
                END), 0) as Total_Pemasukan,
                COALESCE(SUM(CASE 
                    WHEN t.Jenis_Transaksi = 'Pengeluaran' THEN t.Jumlah 
                    ELSE 0 
                END), 0) as Total_Pengeluaran,
                COALESCE(SUM(n.nota_count), 0) as Total_Nota,
                COALESCE(SUM(n.approved_count), 0) as Nota_Terverifikasi
            FROM project p
            LEFT JOIN transaksi t ON p.ID_Project = t.ID_Project AND YEAR(t.Tanggal_Transaksi) = ? AND MONTH(t.Tanggal_Transaksi) = ? 
            LEFT JOIN (SELECT ID_Transaksi, COUNT(*) AS nota_count,
 SUM(Status_Verifikasi = 'Approved') AS approved_count,
 SUM(Status_Verifikasi = 'Rejected') AS rejected_count,
 SUM(Status_Verifikasi = 'Pending') AS pending_count
 FROM nota GROUP BY ID_Transaksi) n ON t.ID_Transaksi = n.ID_Transaksi
            WHERE (? = 'Admin' OR p.ID_User = ?)
            GROUP BY p.ID_Project, p.Nama_Project, p.Status
            ORDER BY Total_Transaksi DESC
        `;

        const [results] = await db
            .promise()
            .query(query, [year, month, req.user.Role, req.user.ID_User]);

        // Format angka agar tidak muncul sebagai string
        const formattedResults = results.map((row) => ({
            ...row,
            Total_Pemasukan: Number(row.Total_Pemasukan),
            Total_Pengeluaran: Number(row.Total_Pengeluaran),
            Total_Transaksi: Number(row.Total_Transaksi),
            Total_Nota: Number(row.Total_Nota),
            Nota_Terverifikasi: Number(row.Nota_Terverifikasi)
        }));

        // Hitung total keseluruhan dari hasil yang sudah diformat
        const summary = {
            total_pemasukan: Number(
                money.sum(formattedResults.map((row) => row.Total_Pemasukan))
            ),
            total_pengeluaran: Number(
                money.sum(formattedResults.map((row) => row.Total_Pengeluaran))
            ),
            total_transaksi: formattedResults.reduce(
                (sum, row) => sum + row.Total_Transaksi,
                0
            ),
            total_nota: formattedResults.reduce(
                (sum, row) => sum + row.Total_Nota,
                0
            )
        };

        return res.status(200).json({
            status: 'success',
            data: {
                period: `${month}/${year}`,
                summary: summary,
                total_projects: formattedResults.length,
                projects: formattedResults.map((row) => ({
                    id_project: row.ID_Project,
                    nama_project: row.Nama_Project,
                    status_project: row.Status_Project,
                    statistik: {
                        total_transaksi: row.Total_Transaksi,
                        total_pemasukan: row.Total_Pemasukan,
                        total_pengeluaran: row.Total_Pengeluaran,
                        total_nota: row.Total_Nota,
                        nota_terverifikasi: row.Nota_Terverifikasi
                    }
                }))
            }
        });

        // Error
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Gagal menampilkan project',
            error: error.message
        });
    }
};

module.exports = {
    getProjectMonthly,
    projectBudgetAdjustment
};
