const db = require('../config/database');
const { invalidateMultipleCache } = require('../utils/cacheUtils');

const getProjectTimeline = async (req, res) => {
    try {
        const { projectId } = req.params;

        const query = `
            SELECT 
                'transaksi' as tipe_aktivitas,
                t.ID_Transaksi as id_aktivitas,
                t.Tanggal_Transaksi as tanggal,
                t.Jenis_Transaksi as jenis,
                t.Jumlah,
                t.Keterangan as deskripsi,
                COALESCE(n.Status_Verifikasi, 'Belum Ada Nota') as status_nota,
                COALESCE(a.Status_Approval, 'Belum Diapprove') as status_approval
            FROM transaksi t
            LEFT JOIN nota n ON n.ID_Nota = (SELECT MAX(n2.ID_Nota) FROM nota n2 WHERE n2.ID_Transaksi = t.ID_Transaksi)
            LEFT JOIN approval a ON a.ID_Approval = (SELECT MAX(a2.ID_Approval) FROM approval a2 WHERE a2.ID_Nota = n.ID_Nota)
            WHERE t.ID_Project = ?
            ORDER BY t.Tanggal_Transaksi DESC`;

        const [results] = await db.promise().query(query, [projectId]);

        return res.status(200).json({
            status: 'success',
            data: {
                project_id: projectId,
                total_aktivitas: results.length,
                timeline: results.map((row) => ({
                    ...row,
                    Jumlah: Number(row.Jumlah)
                }))
            }
        });
    } catch (error) {
        console.error('Error:', error);
        return res
            .status(error.status || 500)
            .json({
                status: 'error',
                message:
                    error.status && error.status < 500
                        ? error.message
                        : 'Terjadi kesalahan pada server'
            });
    }
};

const transferProject = async (req, res) => {
    let connection;
    try {
        connection = await db.promise().getConnection();
        const { source_project_id, target_project_id, transaction_ids } =
            req.body;

        // Validasi input
        if (!source_project_id || !target_project_id || !transaction_ids) {
            return res.status(400).json({
                status: 'error',
                message:
                    'Project source, target, dan transaction IDs diperlukan'
            });
        }

        // Cek keberadaan project
        const [projects] = await connection.query(
            'SELECT ID_Project, Nama_Project FROM project WHERE ID_Project IN (?, ?)',
            [source_project_id, target_project_id]
        );

        if (projects.length !== 2) {
            return res.status(404).json({
                status: 'error',
                message: 'Project source atau target tidak ditemukan'
            });
        }

        await connection.query('START TRANSACTION');

        const [selected] = await connection.query(
            'SELECT ID_Transaksi FROM transaksi WHERE ID_Project = ? AND ID_Transaksi IN (?) FOR UPDATE',
            [source_project_id, transaction_ids]
        );
        if (selected.length !== transaction_ids.length) {
            const error = new Error(
                'Transaksi tidak ditemukan pada project sumber'
            );
            error.status = 404;
            throw error;
        }
        // Update transaksi
        const [updateResult] = await connection.query(
            'UPDATE transaksi SET ID_Project = ? WHERE ID_Project = ? AND ID_Transaksi IN (?)',
            [target_project_id, source_project_id, transaction_ids]
        );

        // Log untuk setiap transaksi
        for (const transId of transaction_ids) {
            await connection.query(
                `INSERT INTO log_aktivitas (ID_User, Aksi, Tanggal_Aksi) 
               VALUES (?, ?, NOW())`,
                [
                    req.user.ID_User,
                    `Transfer transaksi ID ${transId} dari project ${source_project_id} ke project ${target_project_id}`
                ]
            );
        }

        // Tambahan: Invalidate cache untuk kedua project
        await connection.query('COMMIT');
        await invalidateMultipleCache([
            'project:*',
            'user:*',
            'admin:*',
            'search:*'
        ]);

        return res.status(200).json({
            status: 'success',
            message: `${updateResult.affectedRows} transaksi berhasil ditransfer`,
            data: {
                source_project: projects.find(
                    (p) => p.ID_Project === source_project_id
                ),
                target_project: projects.find(
                    (p) => p.ID_Project === target_project_id
                ),
                transferred_transactions: updateResult.affectedRows
            }
        });
    } catch (error) {
        if (connection) await connection.query('ROLLBACK').catch(() => {});
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
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getProjectTimeline,
    transferProject
};
