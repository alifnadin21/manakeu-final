const { VALIDATION_RULES } = require('./constant');
const validatePassword = (password) => {
    if (typeof password !== 'string') return 'Password tidak valid';
    if (
        password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH ||
        password.length > VALIDATION_RULES.PASSWORD_MAX_LENGTH
    ) {
        return 'Password harus antara 8-50 karakter';
    }

    if (!/[A-Z]/.test(password)) {
        return 'Password harus mengandung minimal 1 huruf besar';
    }

    if (!/[a-z]/.test(password)) {
        return 'Password harus mengandung minimal 1 huruf kecil';
    }

    if (!/\d/.test(password)) {
        return 'Password harus mengandung minimal 1 angka';
    }

    return null;
};

// Fungsi helper untuk validasi nama
const validateNama = (nama) => {
    if (typeof nama !== 'string') return 'Nama tidak valid';
    if (
        nama.length < VALIDATION_RULES.NAMA_MIN_LENGTH ||
        nama.length > VALIDATION_RULES.NAMA_MAX_LENGTH
    ) {
        return 'Nama harus antara 3-50 karakter';
    }

    if (!/^[a-zA-Z0-9\s.]+$/.test(nama)) {
        return 'Nama hanya boleh mengandung huruf, angka, spasi, dan tanda titik';
    }

    if (/\s\s/.test(nama)) {
        return 'Nama tidak boleh mengandung spasi berurutan';
    }

    if (nama.startsWith(' ') || nama.endsWith(' ')) {
        return 'Nama tidak boleh diawali atau diakhiri dengan spasi';
    }

    if (nama.trim().split(/\s+/).length < 2) {
        return 'Nama harus terdiri dari minimal 2 kata';
    }

    if (/^\d|\s\d/.test(nama)) {
        return 'Nama tidak boleh terdapat angka';
    }

    return null;
};
module.exports = { validatePassword, validateNama };
