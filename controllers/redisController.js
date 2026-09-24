const money = require('../utils/money');
// controllers/redisController.js
const redis = require('../utils/cacheClient');
const db = require('../config/database');
const Encryption = require('../utils/encryption');

// 1. User Session & Authentication
const getUserSession = async (req, res) => {
    try {
        const { userId } = req.params;
        const cacheKey = `user:session:${userId}`;

        // Cek cache
        const cachedSession = null;
        if (cachedSession) {
            const decryptedSession = Encryption.decryptObject(cachedSession);
            return res.json({
                status: 'success',
                data: decryptedSession,
                source: 'cache'
            });
        }

        // Ambil dari database
        const [user] = await db.promise().query(
            `SELECT ID_User, Nama, Email, Role, Status, 
            DATE_FORMAT(Update_user, '%Y-%m-%d %H:%i:%s') as last_login
            FROM user WHERE ID_User = ?`,
            [userId]
        );

        if (!user.length) {
            return res.status(404).json({
                status: 'error',
                message: 'User tidak ditemukan'
            });
        }

        const userData = {
            user_id: user[0].ID_User,
            nama: user[0].Nama,
            email: user[0].Email,
            role: user[0].Role,
            status: user[0].Status,
            last_login: user[0].last_login,
            api_key: user[0].API_Key // Data sensitif
        };

        // Simpan ke cache dengan TTL 24 jam
        const encryptedData = Encryption.encryptObject(userData);
        await redis.setex(cacheKey, 86400, encryptedData);

        return res.json({
            status: 'success',
            data: userData,
            source: 'database'
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: 'error',
            message:
                error.status && error.status < 500
                    ? error.message
                    : 'Terjadi kesalahan pada server'
        });
    }
};

// 2. Recent Activities
const getUserActivities = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10 } = req.query;
        const cacheKey = `user:activities:${userId}:${limit}`;

        // Cek cache
        const cachedActivities = await redis.get(cacheKey);
        if (cachedActivities) {
            return res.json({
                status: 'success',
                data: JSON.parse(cachedActivities),
                source: 'cache'
            });
        }

        // Query database
        const [activities] = await db.promise().query(
            `SELECT 
                ID_Log,
                DATE_FORMAT(Tanggal_Aksi, '%Y-%m-%d %H:%i:%s') as tanggal,
                Aksi as detail
            FROM log_aktivitas
            WHERE ID_User = ?
            ORDER BY Tanggal_Aksi DESC
            LIMIT ?`,
            [userId, parseInt(limit)]
        );

        const activitiesData = activities.map((act) => ({
            id: act.ID_Log,
            tanggal: act.tanggal,
            detail: act.detail
        }));

        // Simpan ke cache dengan TTL 15 menit
        await redis.setex(cacheKey, 900, JSON.stringify(activitiesData));

        return res.json({
            status: 'success',
            data: activitiesData,
            source: 'database'
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: 'error',
            message:
                error.status && error.status < 500
                    ? error.message
                    : 'Terjadi kesalahan pada server'
        });
    }
};

// 3. Project Summary
const getProjectSummary = async (req, res) => {
    try {
        const { projectId } = req.params;
        const cacheKey = `project:summary:${projectId}`;

        // Cek cache
        const cachedSummary = await redis.get(cacheKey);
        if (cachedSummary) {
            return res.json({
                status: 'success',
                data: JSON.parse(cachedSummary),
                source: 'cache'
            });
        }

        // Query database untuk summary
        const [summary] = await db.promise().query(
            `SELECT 
                p.ID_Project,
                p.Nama_Project,
                p.Status as Status_Project,
                COUNT(t.ID_Transaksi) as total_transaksi,
                COALESCE(SUM(CASE 
                    WHEN t.Jenis_Transaksi = 'Pemasukan' THEN t.Jumlah 
                    ELSE 0 
                END), 0) as total_pemasukan,
                COALESCE(SUM(CASE 
                    WHEN t.Jenis_Transaksi = 'Pengeluaran' THEN t.Jumlah 
                    ELSE 0 
                END), 0) as total_pengeluaran,
                COALESCE(SUM(n.nota_count), 0) as total_nota,
                COALESCE(SUM(n.approved_count), 0) as nota_approved
            FROM project p
            LEFT JOIN transaksi t ON p.ID_Project = t.ID_Project
            LEFT JOIN (SELECT ID_Transaksi, COUNT(*) AS nota_count,
 SUM(Status_Verifikasi = 'Approved') AS approved_count,
 SUM(Status_Verifikasi = 'Rejected') AS rejected_count,
 SUM(Status_Verifikasi = 'Pending') AS pending_count
 FROM nota GROUP BY ID_Transaksi) n ON t.ID_Transaksi = n.ID_Transaksi
            WHERE p.ID_Project = ?
            GROUP BY p.ID_Project`,
            [projectId]
        );

        if (!summary.length) {
            return res.status(404).json({
                status: 'error',
                message: 'Project tidak ditemukan'
            });
        }

        const summaryData = {
            ...summary[0],
            total_pemasukan: Number(summary[0].total_pemasukan),
            total_pengeluaran: Number(summary[0].total_pengeluaran),
            profit: Number(
                money.subtract(
                    summary[0].total_pemasukan,
                    summary[0].total_pengeluaran
                )
            )
        };

        // Simpan ke cache dengan TTL 30 menit
        await redis.setex(cacheKey, 1800, JSON.stringify(summaryData));

        return res.json({
            status: 'success',
            data: summaryData,
            source: 'database'
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: 'error',
            message:
                error.status && error.status < 500
                    ? error.message
                    : 'Terjadi kesalahan pada server'
        });
    }
};

// 4. Approval Statistics Cache
const getApprovalStats = async (req, res) => {
    try {
        const { adminId } = req.params;
        const cacheKey = `admin:approval:stats:${adminId}`;

        // Cek cache
        const cachedStats = await redis.get(cacheKey);
        if (cachedStats) {
            return res.json({
                status: 'success',
                data: JSON.parse(cachedStats),
                source: 'cache'
            });
        }

        // Query dari database
        const [stats] = await db.promise().query(
            `SELECT 
                u.ID_User,
                u.Nama as nama_admin,
                COUNT(a.ID_Approval) as total_approval,
                SUM(CASE WHEN a.Status_Approval = 'Approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN a.Status_Approval = 'Rejected' THEN 1 ELSE 0 END) as rejected,
                COUNT(DISTINCT n.ID_Transaksi) as total_transaksi,
                COUNT(DISTINCT t.ID_Project) as total_project,
                MAX(a.Tanggal_Approval) as last_approval
            FROM user u
            LEFT JOIN approval a ON u.ID_User = a.ID_Admin
            LEFT JOIN nota n ON a.ID_Nota = n.ID_Nota
            LEFT JOIN transaksi t ON n.ID_Transaksi = t.ID_Transaksi
            WHERE u.ID_User = ? AND u.Role = 'Admin'
            GROUP BY u.ID_User, u.Nama`,
            [adminId]
        );

        if (!stats.length) {
            return res.status(404).json({
                status: 'error',
                message: 'Admin tidak ditemukan'
            });
        }

        const statsData = {
            ...stats[0],
            total_approval: Number(stats[0].total_approval),
            approved: Number(stats[0].approved),
            rejected: Number(stats[0].rejected),
            total_transaksi: Number(stats[0].total_transaksi),
            total_project: Number(stats[0].total_project),
            approval_rate: stats[0].total_approval
                ? ((stats[0].approved / stats[0].total_approval) * 100).toFixed(
                      2
                  )
                : 0
        };

        // Simpan ke cache dengan TTL 1 jam
        await redis.setex(cacheKey, 3600, JSON.stringify(statsData));

        return res.json({
            status: 'success',
            data: statsData,
            source: 'database'
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: 'error',
            message:
                error.status && error.status < 500
                    ? error.message
                    : 'Terjadi kesalahan pada server'
        });
    }
};

// 5. Transaction Timeline Cache
const getTransactionTimeline = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { limit = 10 } = req.query;
        const cacheKey = `project:timeline:${projectId}:${limit}`;

        // Cek cache
        const cachedTimeline = await redis.get(cacheKey);
        if (cachedTimeline) {
            return res.json({
                status: 'success',
                data: JSON.parse(cachedTimeline),
                source: 'cache'
            });
        }

        // Query dari database
        const [timeline] = await db.promise().query(
            `SELECT 
                t.ID_Transaksi,
                DATE_FORMAT(t.Tanggal_Transaksi, '%Y-%m-%d') as tanggal,
                t.Jenis_Transaksi as jenis,
                t.Jumlah,
                t.Keterangan,
                n.Status_Verifikasi as status_nota,
                a.Status_Approval as status_approval,
                DATE_FORMAT(n.Tanggal_Verifikasi, '%Y-%m-%d') as tanggal_verifikasi
            FROM transaksi t
            LEFT JOIN nota n ON n.ID_Nota = (SELECT MAX(n2.ID_Nota) FROM nota n2 WHERE n2.ID_Transaksi = t.ID_Transaksi)
            LEFT JOIN approval a ON a.ID_Approval = (SELECT MAX(a2.ID_Approval) FROM approval a2 WHERE a2.ID_Nota = n.ID_Nota)
            WHERE t.ID_Project = ?
            ORDER BY t.Tanggal_Transaksi DESC
            LIMIT ?`,
            [projectId, parseInt(limit)]
        );

        const timelineData = timeline.map((item) => ({
            ...item,
            Jumlah: Number(item.Jumlah)
        }));

        // Simpan ke cache dengan TTL 20 menit
        await redis.setex(cacheKey, 1200, JSON.stringify(timelineData));

        return res.json({
            status: 'success',
            data: timelineData,
            source: 'database'
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: 'error',
            message:
                error.status && error.status < 500
                    ? error.message
                    : 'Terjadi kesalahan pada server'
        });
    }
};

// 6. Notification Counter Cache
const getNotificationCounter = async (req, res) => {
    try {
        const { userId } = req.params;
        const cacheKey = `user:notifications:count:${userId}`;

        // Cek cache
        const cachedCounter = await redis.get(cacheKey);
        if (cachedCounter) {
            return res.json({
                status: 'success',
                data: JSON.parse(cachedCounter),
                source: 'cache'
            });
        }

        // Query dari database
        const [notaStats] = await db.promise().query(
            `SELECT 
                COUNT(CASE WHEN Status_Verifikasi = 'Pending' THEN 1 END) as pending_verifikasi,
                COUNT(CASE WHEN Status_Verifikasi = 'Rejected' THEN 1 END) as rejected_nota
            FROM nota 
            WHERE ID_User = ?`,
            [userId]
        );

        const [approvalStats] = await db.promise().query(
            `SELECT 
                COUNT(CASE WHEN Status_Approval = 'Approved' THEN 1 END) as approved_nota,
                COUNT(CASE WHEN Status_Approval = 'Rejected' THEN 1 END) as rejected_approval
            FROM nota n
            JOIN approval a ON n.ID_Nota = a.ID_Nota
            WHERE n.ID_User = ?
            AND n.Tanggal_Verifikasi >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            [userId]
        );

        const counterData = {
            total_unread:
                Number(notaStats[0].pending_verifikasi) +
                Number(notaStats[0].rejected_nota),
            notifications: {
                pending_verifikasi: Number(notaStats[0].pending_verifikasi),
                rejected_nota: Number(notaStats[0].rejected_nota),
                approved_nota: Number(approvalStats[0].approved_nota),
                rejected_approval: Number(approvalStats[0].rejected_approval)
            },
            last_updated: new Date().toISOString()
        };

        // Simpan ke cache dengan TTL 5 menit
        await redis.setex(cacheKey, 300, JSON.stringify(counterData));

        return res.json({
            status: 'success',
            data: counterData,
            source: 'database'
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: 'error',
            message:
                error.status && error.status < 500
                    ? error.message
                    : 'Terjadi kesalahan pada server'
        });
    }
};

// 7. Monthly Report Cache
const getMonthlyReport = async (req, res) => {
    try {
        const { projectId } = req.params;
        const {
            year = new Date().getFullYear(),
            month = new Date().getMonth() + 1
        } = req.query;
        const cacheKey = `project:monthly:${projectId}:${year}-${month}`;

        // Cek cache
        const cachedReport = await redis.get(cacheKey);
        if (cachedReport) {
            return res.json({
                status: 'success',
                data: JSON.parse(cachedReport),
                source: 'cache'
            });
        }

        // Query dari database
        const [report] = await db.promise().query(
            `SELECT 
                p.Nama_Project,
                COUNT(t.ID_Transaksi) as total_transaksi,
                COALESCE(SUM(CASE 
                    WHEN t.Jenis_Transaksi = 'Pemasukan' THEN t.Jumlah 
                    ELSE 0 
                END), 0) as total_pemasukan,
                COALESCE(SUM(CASE 
                    WHEN t.Jenis_Transaksi = 'Pengeluaran' THEN t.Jumlah 
                    ELSE 0 
                END), 0) as total_pengeluaran,
                COALESCE(SUM(n.nota_count), 0) as total_nota,
                COALESCE(SUM(n.approved_count), 0) as nota_approved
            FROM project p
            LEFT JOIN transaksi t ON p.ID_Project = t.ID_Project 
                AND YEAR(t.Tanggal_Transaksi) = ? 
                AND MONTH(t.Tanggal_Transaksi) = ?
            LEFT JOIN (SELECT ID_Transaksi, COUNT(*) AS nota_count,
 SUM(Status_Verifikasi = 'Approved') AS approved_count,
 SUM(Status_Verifikasi = 'Rejected') AS rejected_count,
 SUM(Status_Verifikasi = 'Pending') AS pending_count
 FROM nota GROUP BY ID_Transaksi) n ON t.ID_Transaksi = n.ID_Transaksi
            WHERE p.ID_Project = ?
            GROUP BY p.ID_Project, p.Nama_Project`,
            [year, month, projectId]
        );

        if (!report.length) {
            return res.status(404).json({
                status: 'error',
                message: 'Project tidak ditemukan atau belum ada transaksi'
            });
        }

        const reportData = {
            project_id: parseInt(projectId),
            nama_project: report[0].Nama_Project,
            periode: {
                tahun: parseInt(year),
                bulan: parseInt(month)
            },
            statistik: {
                total_transaksi: Number(report[0].total_transaksi),
                total_pemasukan: Number(report[0].total_pemasukan),
                total_pengeluaran: Number(report[0].total_pengeluaran),
                profit: Number(
                    money.subtract(
                        report[0].total_pemasukan,
                        report[0].total_pengeluaran
                    )
                ),
                total_nota: Number(report[0].total_nota),
                nota_approved: Number(report[0].nota_approved)
            }
        };

        // Simpan ke cache dengan TTL 1 hari
        await redis.setex(cacheKey, 86400, JSON.stringify(reportData));

        return res.json({
            status: 'success',
            data: reportData,
            source: 'database'
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: 'error',
            message:
                error.status && error.status < 500
                    ? error.message
                    : 'Terjadi kesalahan pada server'
        });
    }
};

// 8. User Dashboard Cache
const getUserDashboard = async (req, res) => {
    try {
        const { userId } = req.params;
        const cacheKey = `user:dashboard:${userId}`;

        // Cek cache
        const cachedDashboard = await redis.get(cacheKey);
        if (cachedDashboard) {
            return res.json({
                status: 'success',
                data: JSON.parse(cachedDashboard),
                source: 'cache'
            });
        }

        // Query multiple data
        const [projects] = await db.promise().query(
            `SELECT COUNT(*) as total_projects,
                    COUNT(CASE WHEN Status = 'Active' THEN 1 END) as active_projects
            FROM project WHERE ID_User = ?`,
            [userId]
        );

        const [transactions] = await db.promise().query(
            `SELECT COUNT(*) as total_transactions,
                    COALESCE(SUM(CASE 
                        WHEN Jenis_Transaksi = 'Pemasukan' THEN Jumlah 
                        ELSE 0 
                    END), 0) as total_income,
                    COALESCE(SUM(CASE 
                        WHEN Jenis_Transaksi = 'Pengeluaran' THEN Jumlah 
                        ELSE 0 
                    END), 0) as total_expense
            FROM transaksi WHERE ID_User = ?`,
            [userId]
        );

        const [notas] = await db.promise().query(
            `SELECT COUNT(*) as total_notas,
                    COUNT(CASE WHEN Status_Verifikasi = 'Pending' THEN 1 END) as pending_notas
            FROM nota WHERE ID_User = ?`,
            [userId]
        );

        const [recentActivities] = await db.promise().query(
            `SELECT ID_Log, Aksi, DATE_FORMAT(Tanggal_Aksi, '%Y-%m-%d %H:%i:%s') as tanggal
            FROM log_aktivitas 
            WHERE ID_User = ? 
            ORDER BY Tanggal_Aksi DESC LIMIT 5`,
            [userId]
        );

        const dashboardData = {
            projects: {
                total: Number(projects[0].total_projects),
                active: Number(projects[0].active_projects)
            },
            transactions: {
                total: Number(transactions[0].total_transactions),
                total_income: Number(transactions[0].total_income),
                total_expense: Number(transactions[0].total_expense),
                balance: Number(
                    money.subtract(
                        transactions[0].total_income,
                        transactions[0].total_expense
                    )
                )
            },
            notas: {
                total: Number(notas[0].total_notas),
                pending: Number(notas[0].pending_notas)
            },
            recent_activities: recentActivities,
            last_updated: new Date().toISOString()
        };

        // Simpan ke cache dengan TTL 10 menit
        await redis.setex(cacheKey, 600, JSON.stringify(dashboardData));

        return res.json({
            status: 'success',
            data: dashboardData,
            source: 'database'
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: 'error',
            message:
                error.status && error.status < 500
                    ? error.message
                    : 'Terjadi kesalahan pada server'
        });
    }
};

// 9. Project Members Cache
const getProjectMembers = async (req, res) => {
    try {
        const { projectId } = req.params;
        const cacheKey = `project:members:${projectId}`;

        // Cek cache
        const cachedMembers = await redis.get(cacheKey);
        if (cachedMembers) {
            return res.json({
                status: 'success',
                data: JSON.parse(cachedMembers),
                source: 'cache'
            });
        }

        // Query dari database
        const [members] = await db.promise().query(
            `SELECT DISTINCT 
                u.ID_User,
                u.Nama,
                u.Role,
                COUNT(t.ID_Transaksi) as total_transaksi,
                COALESCE(SUM(n.nota_count), 0) as total_nota
            FROM user u
            JOIN transaksi t ON u.ID_User = t.ID_User
            LEFT JOIN (SELECT ID_Transaksi, COUNT(*) AS nota_count,
 SUM(Status_Verifikasi = 'Approved') AS approved_count,
 SUM(Status_Verifikasi = 'Rejected') AS rejected_count,
 SUM(Status_Verifikasi = 'Pending') AS pending_count
 FROM nota GROUP BY ID_Transaksi) n ON t.ID_Transaksi = n.ID_Transaksi
            WHERE t.ID_Project = ?
            GROUP BY u.ID_User, u.Nama, u.Role`,
            [projectId]
        );

        const membersData = {
            project_id: parseInt(projectId),
            total_members: members.length,
            members: members.map((member) => ({
                id: member.ID_User,
                nama: member.Nama,
                role: member.Role,
                kontribusi: {
                    transaksi: Number(member.total_transaksi),
                    nota: Number(member.total_nota)
                }
            }))
        };

        // Simpan ke cache dengan TTL 1 jam
        await redis.setex(cacheKey, 3600, JSON.stringify(membersData));

        return res.json({
            status: 'success',
            data: membersData,
            source: 'database'
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: 'error',
            message:
                error.status && error.status < 500
                    ? error.message
                    : 'Terjadi kesalahan pada server'
        });
    }
};

// 10. Search Results Cache
const getSearchResults = async (req, res) => {
    try {
        const { query } = req.query;
        if (typeof query !== 'string' || !query.trim() || query.length > 100) {
            return res.status(400).json({
                status: 'error',
                message: 'Query pencarian diperlukan'
            });
        }

        const cacheKey = `search:results:${req.user.ID_User}:${req.user.Role}:${query.toLowerCase()}`;

        // Cek cache
        const cachedResults = await redis.get(cacheKey);
        if (cachedResults) {
            return res.json({
                status: 'success',
                data: JSON.parse(cachedResults),
                source: 'cache'
            });
        }

        // Query dari database
        const [projects] = await db.promise().query(
            `SELECT ID_Project, Nama_Project, Status, 'project' as type
            FROM project 
            WHERE (Nama_Project LIKE ? OR Deskripsi LIKE ?) AND (? = 'Admin' OR ID_User = ?) LIMIT 100`,
            [`%${query}%`, `%${query}%`, req.user.Role, req.user.ID_User]
        );

        const [transactions] = await db.promise().query(
            `SELECT ID_Transaksi, Jenis_Transaksi, Jumlah, Keterangan, 'transaction' as type
            FROM transaksi 
            WHERE Keterangan LIKE ? AND (? = 'Admin' OR ID_User = ?) LIMIT 100`,
            [`%${query}%`, req.user.Role, req.user.ID_User]
        );

        const searchResults = {
            query: query,
            total_results: projects.length + transactions.length,
            results: {
                projects: projects.map((p) => ({
                    ...p,
                    type: 'project'
                })),
                transactions: transactions.map((t) => ({
                    ...t,
                    Jumlah: Number(t.Jumlah),
                    type: 'transaction'
                }))
            },
            timestamp: new Date().toISOString()
        };

        // Simpan ke cache dengan TTL 5 menit
        await redis.setex(cacheKey, 300, JSON.stringify(searchResults));

        return res.json({
            status: 'success',
            data: searchResults,
            source: 'database'
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: 'error',
            message:
                error.status && error.status < 500
                    ? error.message
                    : 'Terjadi kesalahan pada server'
        });
    }
};

module.exports = {
    getUserSession,
    getProjectSummary,
    getUserActivities,
    getApprovalStats,
    getTransactionTimeline,
    getNotificationCounter,
    getMonthlyReport,
    getUserDashboard,
    getProjectMembers,
    getSearchResults
};
