require('dotenv').config();
const mysql = require('mysql2');
// Each financial unit of work leases its own connection from this pool.
module.exports = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 100,
    connectTimeout: 5000,
    dateStrings: true,
    charset: 'utf8mb4'
});
