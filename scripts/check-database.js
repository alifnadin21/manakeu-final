const db = require('../config/database');
(async () => {
    try {
        const [columns] = await db
            .promise()
            .query(
                'SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()'
            );
        const has = (table, column) =>
            columns.some(
                (c) =>
                    c.TABLE_NAME.toLowerCase() === table.toLowerCase() &&
                    c.COLUMN_NAME === column
            );
        for (const [table, key] of Object.entries({
            user: 'API_Key',
            project: 'ID_User',
            transaksi: 'ID_User',
            nota: 'ID_User',
            approval: 'ID_Admin',
            log_aktivitas: 'ID_User',
            Payments: 'Order_ID'
        }))
            console.log(
                table +
                    '.' +
                    key +
                    ': ' +
                    (has(table, key) ? 'present' : 'MISSING')
            );
        for (const table of ['project', 'transaksi', 'nota']) {
            const [[r]] = await db
                .promise()
                .query(
                    'SELECT COUNT(*) AS count FROM ' +
                        table +
                        ' r LEFT JOIN user u ON u.ID_User=r.ID_User WHERE u.ID_User IS NULL'
                );
            console.log(table + ' orphan owners: ' + r.count);
        }
    } catch (error) {
        console.error('Database check failed:', error.code || error.message);
        process.exitCode = 1;
    } finally {
        await db.promise().end();
    }
})();
