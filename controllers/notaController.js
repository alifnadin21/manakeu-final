const db = require('../config/database');
const { invalidateMultipleCache } = require('../utils/cacheUtils');

const getNotaAnalysis = async (req, res) => {
    try {
        const query = `
 SELECT p.ID_Project, p.Nama_Project,
 COALESCE(SUM(n.nota_count),0) AS Total_Nota,
 COALESCE(SUM(n.approved_count),0) AS Nota_Approved,
 COALESCE(SUM(n.rejected_count),0) AS Nota_Rejected,
 COALESCE(SUM(n.pending_count),0) AS Nota_Pending,
 COALESCE(SUM(n.verification_days)/NULLIF(SUM(n.verified_count),0),0) AS Rata_Rata_Waktu_Verifikasi,
 COALESCE(SUM(t.Jumlah),0) AS Total_Nilai_Transaksi
 FROM project p LEFT JOIN transaksi t ON t.ID_Project=p.ID_Project
 LEFT JOIN (SELECT ID_Transaksi,COUNT(*) AS nota_count,
 SUM(Status_Verifikasi='Approved') AS approved_count,
 SUM(Status_Verifikasi='Rejected') AS rejected_count,
 SUM(Status_Verifikasi='Pending') AS pending_count,
 SUM(DATEDIFF(Tanggal_Verifikasi,Tanggal_Unggah)) AS verification_days,
 COUNT(Tanggal_Verifikasi) AS verified_count FROM nota GROUP BY ID_Transaksi) n ON n.ID_Transaksi=t.ID_Transaksi
 GROUP BY p.ID_Project,p.Nama_Project ORDER BY Total_Nota DESC`;

        const [results] = await db.promise().query(query);

        return res.status(200).json({
            status: 'success',
            data: {
                total_projects: results.length,
                projects: results.map((row) => ({
                    id_project: row.ID_Project,
                    nama_project: row.Nama_Project,
                    analisis_nota: {
                        total_nota: Number(row.Total_Nota),
                        nota_approved: Number(row.Nota_Approved),
                        nota_rejected: Number(row.Nota_Rejected),
                        nota_pending: Number(row.Nota_Pending),
                        rata_rata_waktu_verifikasi:
                            Number(row.Rata_Rata_Waktu_Verifikasi) || 0,
                        total_nilai_transaksi:
                            Number(row.Total_Nilai_Transaksi) || 0
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

const getNotaUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let statusCondition = '';
        if (status) {
            statusCondition = 'AND n.Status_Verifikasi = ?';
        }

        const query = `
            SELECT 
                n.ID_Nota,
                n.File_Nota,
                n.Status_Verifikasi,
                n.Tanggal_Unggah,
                COALESCE(n.Tanggal_Verifikasi, 'Belum diverifikasi') as Tanggal_Verifikasi,
                t.ID_Transaksi,
                t.Jumlah,
                t.Jenis_Transaksi,
                t.Keterangan,
                p.ID_Project,
                p.Nama_Project,
                COALESCE(a.Status_Approval, 'Belum diproses') as Status_Approval,
                COALESCE(a.Catatan, 'Belum ada catatan') as Catatan_Approval,
                COALESCE(a.Tanggal_Approval, 'Belum diapprove') as Tanggal_Approval,
                COALESCE(adm.Nama, 'Belum ditugaskan') as Nama_Approver
            FROM nota n
            JOIN transaksi t ON n.ID_Transaksi = t.ID_Transaksi
            JOIN user u ON t.ID_User = u.ID_User
            LEFT JOIN project p ON t.ID_Project = p.ID_Project
            LEFT JOIN approval a ON a.ID_Approval = (SELECT MAX(a2.ID_Approval) FROM approval a2 WHERE a2.ID_Nota = n.ID_Nota)
            LEFT JOIN user adm ON a.ID_Admin = adm.ID_User
            WHERE t.ID_User = ? ${statusCondition}
            ORDER BY n.Tanggal_Unggah DESC
            LIMIT ? OFFSET ?
        `;

        const [results] = await db
            .promise()
            .query(query, [
                userId,
                ...(status ? [status] : []),
                parseInt(limit),
                parseInt(offset)
            ]);

        const [[count]] = await db
            .promise()
            .query(
                'SELECT COUNT(*) AS total FROM nota n JOIN transaksi t ON n.ID_Transaksi = t.ID_Transaksi WHERE t.ID_User = ? ' +
                    statusCondition,
                [userId, ...(status ? [status] : [])]
            );
        // Tambahkan status badge untuk mempermudah UI
        const getStatusBadge = (status) => {
            switch (status) {
                case 'Approved':
                    return 'success';
                case 'Rejected':
                    return 'danger';
                case 'Pending':
                    return 'warning';
                default:
                    return 'info';
            }
        };

        return res.status(200).json({
            status: 'success',
            data: {
                total_nota: Number(count.total),
                page: parseInt(page),
                limit: parseInt(limit),
                notas: results.map((row) => ({
                    id_nota: row.ID_Nota,
                    file_nota: row.File_Nota,
                    status_verifikasi: row.Status_Verifikasi,
                    status_badge: getStatusBadge(row.Status_Verifikasi),
                    tanggal_unggah: row.Tanggal_Unggah,
                    tanggal_verifikasi: row.Tanggal_Verifikasi,
                    transaksi: {
                        id: row.ID_Transaksi,
                        jumlah: Number(row.Jumlah),
                        jenis: row.Jenis_Transaksi,
                        keterangan: row.Keterangan
                    },
                    project: {
                        id: row.ID_Project,
                        nama: row.Nama_Project
                    },
                    approval: {
                        status: row.Status_Approval,
                        status_badge: getStatusBadge(row.Status_Approval),
                        catatan: row.Catatan_Approval,
                        tanggal: row.Tanggal_Approval,
                        approver: row.Nama_Approver
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

const notaRevisionRequest = async (req, res) => {
    let connection;
    try {
        connection = await db.promise().getConnection();
        const { nota_ids, catatan_revisi, deadline } = req.body;

        if (!nota_ids || !Array.isArray(nota_ids) || !catatan_revisi) {
            return res.status(400).json({
                status: 'error',
                message: 'ID nota dan catatan revisi diperlukan'
            });
        }

        await connection.query('START TRANSACTION');

        // Validasi nota
        const [existingNotas] = await connection.query(
            `SELECT n.ID_Nota, n.Status_Verifikasi, t.ID_User, t.ID_Project 
             FROM nota n
             JOIN transaksi t ON n.ID_Transaksi = t.ID_Transaksi
             WHERE n.ID_Nota IN (?) ORDER BY n.ID_Nota FOR UPDATE`,
            [nota_ids]
        );

        if (existingNotas.length !== nota_ids.length) {
            if (connection) await connection.query('ROLLBACK').catch(() => {});
            return res.status(404).json({
                status: 'error',
                message: 'Beberapa nota tidak ditemukan'
            });
        }

        const results = [];
        const projectIds = new Set();

        for (const nota of existingNotas) {
            // Update status nota menjadi pending
            await connection.query(
                `UPDATE nota 
                 SET Status_Verifikasi = 'Pending',
                     Tanggal_Verifikasi = NULL
                 WHERE ID_Nota = ?`,
                [nota.ID_Nota]
            );

            // Hapus approval sebelumnya jika ada
            await connection.query('DELETE FROM approval WHERE ID_Nota = ?', [
                nota.ID_Nota
            ]);

            // Tambahkan log aktivitas
            await connection.query(
                `INSERT INTO log_aktivitas (ID_User, Aksi, Tanggal_Aksi)
                 VALUES (?, ?, NOW())`,
                [
                    req.user.ID_User,
                    `Request revisi nota ID ${nota.ID_Nota}: ${catatan_revisi}`
                ]
            );

            projectIds.add(nota.ID_Project);

            results.push({
                nota_id: nota.ID_Nota,
                user_id: nota.ID_User,
                status: 'Pending',
                catatan_revisi,
                deadline: deadline || null
            });
        }

        // Tambahan: Invalidate cache untuk semua project yang terkait
        const cachePatterns = [
            ...Array.from(projectIds).map((id) => `project:summary:${id}`),
            `user:notifications:count:*`,
            `admin:approval:stats:*`
        ];
        await invalidateMultipleCache(cachePatterns);

        await connection.query('COMMIT');
        await invalidateMultipleCache([
            'project:*',
            'user:*',
            'admin:*',
            'search:*'
        ]);

        return res.status(200).json({
            status: 'success',
            message: `Berhasil request revisi untuk ${results.length} nota`,
            data: results
        });
    } catch (error) {
        if (connection) await connection.query('ROLLBACK');
        console.error('Error:', error);
        return res.status(500).json({
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
    getNotaAnalysis,
    getNotaUser,
    notaRevisionRequest
};
