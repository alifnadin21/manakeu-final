const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connection = require('../config/database');
const { VALIDATION_RULES, ERROR_MESSAGES } = require('../utils/constant');
const { validatePassword, validateNama } = require('../utils/validation');

const register = async (req, res) => {
    let tx;
    try {
        const { Nama, Email, Password } = req.body;
        const Role = 'User';
        if (req.body.Role && req.body.Role !== 'User')
            return res
                .status(403)
                .json({ error: 'Registrasi publik hanya untuk User' });

        // Validasi input kosong
        if (
            typeof Nama !== 'string' ||
            typeof Email !== 'string' ||
            typeof Password !== 'string'
        ) {
            return res.status(400).json({ error: ERROR_MESSAGES.EMPTY_FIELDS });
        }

        // Validasi nama menggunakan fungsi dari validation.js
        const namaError = validateNama(Nama);
        if (namaError) {
            return res.status(400).json({ error: namaError });
        }

        // Validasi password menggunakan fungsi dari validation.js
        const passwordError = validatePassword(Password);
        if (passwordError) {
            return res.status(400).json({ error: passwordError });
        }

        // Validasi email
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(Email)) {
            return res
                .status(400)
                .json({ error: ERROR_MESSAGES.INVALID_EMAIL });
        }

        // Normalize email
        const normalizedEmail = Email.trim().toLowerCase();

        // Validasi role
        if (!['Admin', 'User'].includes(Role)) {
            return res.status(400).json({ error: ERROR_MESSAGES.INVALID_ROLE });
        }

        // Cek duplikasi email dan nama
        const [existingUsers] = await connection
            .promise()
            .query('SELECT * FROM user WHERE Email = ? OR Nama = ?', [
                normalizedEmail,
                Nama
            ]);

        if (existingUsers.length > 0) {
            if (existingUsers.some((user) => user.Email === normalizedEmail)) {
                return res
                    .status(400)
                    .json({ error: ERROR_MESSAGES.DUPLICATE_EMAIL });
            }
            if (existingUsers.some((user) => user.Nama === Nama)) {
                return res
                    .status(400)
                    .json({ error: ERROR_MESSAGES.DUPLICATE_NAME });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Password, salt);

        tx = await connection.promise().getConnection();
        await tx.beginTransaction();
        // Insert user baru
        const [result] = await tx.query(
            "INSERT INTO user (Nama, Email, Password, Role, Status) VALUES (?, ?, ?, ?, 'Active')",
            [Nama, normalizedEmail, hashedPassword, Role]
        );

        // Log aktivitas
        await tx.query(
            'INSERT INTO log_aktivitas (ID_User, Aksi) VALUES (?, ?)',
            [
                result.insertId,
                `User baru terdaftar dengan email ${normalizedEmail}`
            ]
        );

        await tx.commit();
        res.status(201).json({
            message: 'User berhasil didaftarkan',
            user: {
                ID_User: result.insertId,
                Nama,
                Email: normalizedEmail,
                Role
            }
        });
    } catch (error) {
        if (tx) await tx.rollback().catch(() => {});
        console.error('Server error:', error);
        let errorMessage = ERROR_MESSAGES.SERVER_ERROR;
        if (error.code === 'ER_DUP_ENTRY') {
            errorMessage = 'Data sudah ada dalam database';
        }
        res.status(500).json({ error: errorMessage });
    } finally {
        if (tx) tx.release();
    }
};

const login = async (req, res) => {
    try {
        const { Email, Password } = req.body;

        // Validasi input kosong
        if (
            typeof Email !== 'string' ||
            typeof Password !== 'string' ||
            !Email ||
            !Password
        ) {
            return res.status(400).json({ error: ERROR_MESSAGES.EMPTY_FIELDS });
        }

        // Validasi format email
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(Email)) {
            return res
                .status(400)
                .json({ error: ERROR_MESSAGES.INVALID_EMAIL });
        }

        // Normalize email
        const normalizedEmail = Email.trim().toLowerCase();

        // Cek user di database
        const [users] = await connection
            .promise()
            .query('SELECT * FROM user WHERE Email = ?', [normalizedEmail]);

        if (users.length === 0) {
            return res.status(401).json({ error: ERROR_MESSAGES.AUTH_FAILED });
        }

        const user = users[0];
        if (user.Status !== 'Active' || !user.Password)
            return res.status(401).json({ error: ERROR_MESSAGES.AUTH_FAILED });

        // Verifikasi password
        const validPassword = await bcrypt.compare(Password, user.Password);
        if (!validPassword) {
            return res.status(401).json({ error: ERROR_MESSAGES.AUTH_FAILED });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                ID_User: user.ID_User,
                Email: user.Email,
                Role: user.Role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log aktivitas
        await connection
            .promise()
            .query('INSERT INTO log_aktivitas (ID_User, Aksi) VALUES (?, ?)', [
                user.ID_User,
                'User melakukan login'
            ]);

        res.json({
            message: 'Login berhasil',
            token,
            user: {
                ID_User: user.ID_User,
                Nama: user.Nama,
                Email: user.Email,
                Role: user.Role
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
};

const updateProfile = async (req, res) => {
    let tx;
    try {
        const { Nama, Password, currentPassword } = req.body;
        const userId = req.user.ID_User;

        // Validasi input
        if (!Nama && !Password) {
            return res.status(400).json({
                error: 'Minimal satu field (Nama atau Password) harus diisi untuk update'
            });
        }

        // Cek user di database
        const [users] = await connection
            .promise()
            .query('SELECT * FROM user WHERE ID_User = ?', [userId]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        const user = users[0];
        let updateFields = [];
        let updateValues = [];
        let updateLog = [];

        // Handle password update
        if (Password) {
            if (!currentPassword) {
                return res.status(400).json({
                    error: 'Password saat ini diperlukan untuk mengubah password'
                });
            }

            const validPassword = await bcrypt.compare(
                currentPassword,
                user.Password
            );
            if (!validPassword) {
                return res.status(401).json({
                    error: 'Password saat ini tidak sesuai'
                });
            }

            const passwordError = validatePassword(Password);
            if (passwordError) {
                return res.status(400).json({ error: passwordError });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(Password, salt);
            updateFields.push('Password = ?');
            updateValues.push(hashedPassword);
            updateLog.push('Password diubah');
        }

        // Handle nama update
        if (Nama) {
            const namaError = validateNama(Nama);
            if (namaError) {
                return res.status(400).json({ error: namaError });
            }

            // Cek duplikasi nama
            const [existingNames] = await connection
                .promise()
                .query(
                    'SELECT ID_User FROM user WHERE Nama = ? AND ID_User != ?',
                    [Nama, userId]
                );

            if (existingNames.length > 0) {
                return res
                    .status(400)
                    .json({ error: ERROR_MESSAGES.DUPLICATE_NAME });
            }

            updateFields.push('Nama = ?');
            updateValues.push(Nama);
            updateLog.push(`Nama diubah menjadi ${Nama}`);
        }

        // Tambahkan userId untuk WHERE clause
        updateValues.push(userId);

        tx = await connection.promise().getConnection();
        await tx.beginTransaction();
        // Update user
        await tx.query(
            `UPDATE user SET ${updateFields.join(', ')} WHERE ID_User = ?`,
            updateValues
        );

        // Log aktivitas
        await tx.query(
            'INSERT INTO log_aktivitas (ID_User, Aksi) VALUES (?, ?)',
            [userId, `User mengupdate profile: ${updateLog.join(', ')}`]
        );

        // Ambil data user terbaru
        const [updatedUser] = await tx.query(
            'SELECT ID_User, Nama, Email, Role, Tanggal_Buat FROM user WHERE ID_User = ?',
            [userId]
        );

        await tx.commit();
        res.json({
            message: 'Profile berhasil diupdate',
            user: updatedUser[0]
        });
    } catch (error) {
        if (tx) await tx.rollback();
        console.error('Server error:', error);
        res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    } finally {
        if (tx) tx.release();
    }
};

const getProfile = async (req, res) => {
    try {
        const [user] = await connection
            .promise()
            .query(
                'SELECT ID_User, Nama, Email, Role, Tanggal_Buat FROM user WHERE ID_User = ?',
                [req.user.ID_User]
            );

        if (user.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        res.json({ user: user[0] });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
};

const handleGoogleCallback = async (req, res) => {
    try {
        const token = jwt.sign(
            {
                ID_User: req.user.ID_User,
                Email: req.user.Email,
                Role: req.user.Role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log aktivitas
        await connection
            .promise()
            .query('INSERT INTO log_aktivitas (ID_User, Aksi) VALUES (?, ?)', [
                req.user.ID_User,
                'Login via Google'
            ]);

        res.json({
            status: 'success',
            message: 'Google login berhasil',
            token,
            user: {
                ID_User: req.user.ID_User,
                Email: req.user.Email,
                Role: req.user.Role
            }
        });
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Gagal login dengan Google'
        });
    }
};

module.exports = {
    register,
    login,
    updateProfile,
    getProfile,
    handleGoogleCallback
};
