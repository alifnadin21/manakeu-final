const db = require('../config/database');

const userActivityReport = async (req, res) => {
    try {
        const { user_id, start_date, end_date } = req.body;

        // Validasi input
        if (!user_id || !start_date || !end_date) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID, tanggal awal, dan tanggal akhir diperlukan'
            });
        }

        // Definisikan semua query di dalam function
        const transactionQuery = `
            SELECT 
                COUNT(*) as total_transaksi,
                SUM(CASE WHEN t.Jenis_Transaksi = 'Pemasukan' THEN 1 ELSE 0 END) as total_pemasukan,
                SUM(CASE WHEN t.Jenis_Transaksi = 'Pengeluaran' THEN 1 ELSE 0 END) as total_pengeluaran,
                COUNT(DISTINCT t.ID_Project) as total_project,
                COALESCE(SUM(t.Jumlah), 0) as total_nilai_transaksi,
                COALESCE(SUM(n.nota_count), 0) as total_nota_diupload
            FROM transaksi t
            LEFT JOIN (SELECT ID_Transaksi, COUNT(*) AS nota_count,
 SUM(Status_Verifikasi = 'Approved') AS approved_count,
 SUM(Status_Verifikasi = 'Rejected') AS rejected_count,
 SUM(Status_Verifikasi = 'Pending') AS pending_count
 FROM nota GROUP BY ID_Transaksi) n ON t.ID_Transaksi = n.ID_Transaksi
            WHERE t.ID_User = ?
            AND t.Tanggal_Transaksi BETWEEN ? AND ?
        `;

        const notaQuery = `
            SELECT 
                COUNT(*) as total_nota,
                SUM(CASE WHEN n.Status_Verifikasi = 'Approved' THEN 1 ELSE 0 END) as nota_approved,
                SUM(CASE WHEN n.Status_Verifikasi = 'Rejected' THEN 1 ELSE 0 END) as nota_rejected,
                SUM(CASE WHEN n.Status_Verifikasi = 'Pending' THEN 1 ELSE 0 END) as nota_pending
            FROM nota n
            JOIN transaksi t ON n.ID_Transaksi = t.ID_Transaksi
            WHERE t.ID_User = ?
            AND n.Tanggal_Unggah BETWEEN ? AND ?
        `;

        const logQuery = `
            SELECT 
                DATE_FORMAT(Tanggal_Aksi, '%Y-%m-%d') as tanggal,
                COUNT(*) as jumlah_aktivitas,
                GROUP_CONCAT(Aksi SEPARATOR '|') as detail_aktivitas
            FROM log_aktivitas
            WHERE ID_User = ?
            AND Tanggal_Aksi >= ? AND Tanggal_Aksi < DATE_ADD(?, INTERVAL 1 DAY)
            GROUP BY DATE_FORMAT(Tanggal_Aksi, '%Y-%m-%d')
            ORDER BY tanggal DESC
        `;

        // Eksekusi semua query
        const [[[transactionSummary]], [[notaSummary]], [logs]] =
            await Promise.all([
                db
                    .promise()
                    .query(transactionQuery, [user_id, start_date, end_date]),
                db.promise().query(notaQuery, [user_id, start_date, end_date]),
                db.promise().query(logQuery, [user_id, start_date, end_date])
            ]);

        // Format logs dengan pengecekan null
        const formattedLogs = logs.map((log) => ({
            tanggal: log.tanggal,
            jumlah_aktivitas: log.jumlah_aktivitas,
            detail_aktivitas: log.detail_aktivitas
                ? log.detail_aktivitas.split('|')
                : []
        }));

        return res.status(200).json({
            status: 'success',
            data: {
                periode: {
                    start: start_date,
                    end: end_date
                },
                ringkasan_transaksi: {
                    ...transactionSummary,
                    rata_rata_nilai:
                        transactionSummary.total_transaksi > 0
                            ? (
                                  transactionSummary.total_nilai_transaksi /
                                  transactionSummary.total_transaksi
                              ).toFixed(2)
                            : 0
                },
                ringkasan_nota: notaSummary,
                aktivitas_harian: formattedLogs
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

const projectSummaryReport = async (req, res) => {
    try {
        const { project_id, start_date, end_date } = req.body;

        const query = `
            SELECT 
                p.ID_Project,
                p.Nama_Project,
                p.Status as Status_Project,
                COUNT(DISTINCT t.ID_Transaksi) as Total_Transaksi,
                SUM(CASE WHEN t.Jenis_Transaksi = 'Pemasukan' THEN t.Jumlah ELSE 0 END) as Total_Pemasukan,
                SUM(CASE WHEN t.Jenis_Transaksi = 'Pengeluaran' THEN t.Jumlah ELSE 0 END) as Total_Pengeluaran,
                COALESCE(SUM(n.nota_count), 0) as Total_Nota,
                COALESCE(SUM(n.approved_count), 0) as Nota_Approved,
                COALESCE(SUM(n.rejected_count), 0) as Nota_Rejected,
                COALESCE(SUM(n.pending_count), 0) as Nota_Pending
            FROM project p
            LEFT JOIN transaksi t ON p.ID_Project = t.ID_Project AND t.Tanggal_Transaksi BETWEEN ? AND ?
            LEFT JOIN (SELECT ID_Transaksi, COUNT(*) AS nota_count,
 SUM(Status_Verifikasi = 'Approved') AS approved_count,
 SUM(Status_Verifikasi = 'Rejected') AS rejected_count,
 SUM(Status_Verifikasi = 'Pending') AS pending_count
 FROM nota GROUP BY ID_Transaksi) n ON t.ID_Transaksi = n.ID_Transaksi
            WHERE p.ID_Project = ?
            
            GROUP BY p.ID_Project, p.Nama_Project, p.Status
        `;

        const [projectSummary] = await db
            .promise()
            .query(query, [start_date, end_date, project_id]);

        // Get transaction details
        const [transactions] = await db.promise().query(
            `SELECT t.*, n.Status_Verifikasi as Status_Nota
            FROM transaksi t
            LEFT JOIN nota n ON n.ID_Nota = (SELECT MAX(n2.ID_Nota) FROM nota n2 WHERE n2.ID_Transaksi = t.ID_Transaksi)
            WHERE t.ID_Project = ?
            AND t.Tanggal_Transaksi BETWEEN ? AND ?
            ORDER BY t.Tanggal_Transaksi DESC`,
            [project_id, start_date, end_date]
        );

        return res.status(200).json({
            status: 'success',
            data: {
                summary: projectSummary[0],
                period: {
                    start: start_date,
                    end: end_date
                },
                transactions: transactions
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
    projectSummaryReport,
    userActivityReport
};
