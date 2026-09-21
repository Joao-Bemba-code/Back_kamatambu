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

    await conn.query('CREATE DATABASE IF NOT EXISTS `sgfp`');
    console.log('Database sgfp criada/confirmada na TiDB');

    const [t] = await conn.query('SHOW TABLES FROM `sgfp`');
    console.log('sgfp tem ' + t.length + ' tabelas (antes):');
    for (const r of t) console.log('  - ' + r['Tables_in_sgfp']);

    await conn.end();
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1); });