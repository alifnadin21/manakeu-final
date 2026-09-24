const VALIDATION_RULES = {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 20,
    NAMA_MIN_LENGTH: 3,
    NAMA_MAX_LENGTH: 50
};

const ERROR_MESSAGES = {
    INVALID_EMAIL: 'Format email tidak valid',
    INVALID_PASSWORD: 'Password tidak memenuhi kriteria keamanan',
    DUPLICATE_EMAIL: 'Email sudah terdaftar',
    DUPLICATE_NAME: 'Nama sudah terdaftar',
    SERVER_ERROR: 'Terjadi kesalahan pada server',
    AUTH_FAILED: 'Email atau password salah',
    EMPTY_FIELDS: 'Semua field harus diisi',
    INVALID_ROLE: 'Role harus Admin atau User'
};

module.exports = { VALIDATION_RULES, ERROR_MESSAGES };
