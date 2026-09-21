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

    const [grants] = await conn.query('SHOW GRANTS');
    console.log('--- GRANTS ---');
    for (const g of grants) {
        console.log(Object.values(g)[0]);
    }

    const [dbs] = await conn.query('SHOW DATABASES');
    console.log('\n--- DATABASES ---');
    for (const d of dbs) {
        const name = d.Database;
        try {
            const [t] = await conn.query('SHOW TABLES FROM `' + name + '`');
            console.log('  - ' + name + ' (' + t.length + ' tabelas)');
        } catch (e) {
            console.log('  - ' + name + ' (sem acesso)');
        }
    }

    await conn.end();
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1); });