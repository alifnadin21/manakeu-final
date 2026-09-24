// Isolated local preview: creates an empty workspace and an initial Admin account.
// It never reads or modifies the production database.
const fs = require('fs'),
    path = require('path'),
    crypto = require('crypto');
const mysql = require('mysql2/promise');
(async () => {
    const database = 'manakeu_preview';
    const local = path.join(__dirname, '../.local-test');
    fs.mkdirSync(local, { recursive: true });
    const admin = await mysql.createConnection({
        host: '127.0.0.1',
        port: 33317,
        user: 'root',
        password: '',
        multipleStatements: true
    });
    await admin.query(
        'CREATE DATABASE IF NOT EXISTS ' + database + ' CHARACTER SET utf8mb4'
    );
    await admin.query('USE ' + database);
    const [tables] = await admin.query('SHOW TABLES');
    if (!tables.length)
        await admin.query(
            fs.readFileSync(
                path.join(__dirname, '../migrations/schema-empty.sql'),
                'utf8'
            )
        );
    const file = path.join(local, 'preview-account.json');
    let account;
    if (fs.existsSync(file))
        account = JSON.parse(fs.readFileSync(file, 'utf8'));
    else {
        account = {
            email: 'admin@manakeu.local',
            password: 'Mk' + crypto.randomBytes(7).toString('hex') + '9A'
        };
        const hash = await require('bcryptjs').hash(account.password, 12);
        await admin.query(
            "INSERT INTO user (Nama,Email,Password,Role,Status) VALUES (?,?,?,'Admin','Active')",
            ['Workspace Admin', account.email, hash]
        );
        fs.writeFileSync(file, JSON.stringify(account, null, 2));
    }
    await admin.end();
    Object.assign(process.env, {
        NODE_ENV: 'test',
        DB_HOST: '127.0.0.1',
        DB_PORT: '33317',
        DB_USER: 'root',
        DB_PASSWORD: '',
        DB_NAME: database,
        JWT_SECRET: crypto.randomBytes(48).toString('hex'),
        REDIS_ENABLED: 'false',
        WHATSAPP_ENABLED: 'false',
        GOOGLE_CLIENT_ID: '',
        GOOGLE_CLIENT_SECRET: '',
        API_RATE_LIMIT: '1000'
    });
    const app = require('../app');
    const server = app.listen(3100, '127.0.0.1', () =>
        console.log(
            'Isolated preview API: http://127.0.0.1:3100. Account: .local-test/preview-account.json'
        )
    );
    const shutdown = () =>
        server.close(async () => {
            await require('../config/database').promise().end();
            require('../config/redis').disconnect();
            process.exit(0);
        });
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
})().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
