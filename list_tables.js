require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function main() {
    const conn = await mysql.createConnection({
        host: process.env.Host_database,
        user: process.env.User_database,
        password: process.env.Pass_database,
        port: parseInt(process.env.Port) || 4000,
        ssl: { rejectUnauthorized: false },
        connectTimeout: 60000
    });

    for (const db of ['test', 'sys']) {
        try {
            const [t] = await conn.query('SHOW TABLES FROM `' + db + '`');
            console.log('=== ' + db + ' (' + t.length + ' tabelas) ===');
            const key = 'Tables_in_' + db;
            for (const r of t) {
                try {
                    const [c] = await conn.query('SELECT COUNT(*) c FROM `' + db + '`.`' + r[key] + '`');
                    console.log('  ' + r[key] + ' (' + c[0].c + ' linhas)');
                } catch (e) {
                    console.log('  ' + r[key] + ' (erro)');
                }
            }
        } catch (e) {
            console.log('=== ' + db + ' erro: ' + e.message + ' ===');
        }
    }

    await conn.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
