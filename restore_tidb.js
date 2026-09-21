require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dumpFile = process.argv[2] || 'C:\\Users\\PC\\Documents\\projecto_gest_alter\\dump_sgfp_2026-09-01.sql';
const DB = 'sys';

async function restore() {
    const conn = await mysql.createConnection({
        host: process.env.Host_database,
        user: process.env.User_database,
        password: process.env.Pass_database,
        database: DB,
        port: parseInt(process.env.Port) || 4000,
        ssl: { rejectUnauthorized: false },
        connectTimeout: 60000,
        multipleStatements: true
    });

    console.log('Ligado à TiDB (' + DB + ')!');

    const sql = fs.readFileSync(dumpFile, 'utf8');
    const statements = sql
        .split(/;\s*(?:\n|$)/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('Statements a executar: ' + statements.length);

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.replace(/\s+/g, ' ').slice(0, 120);
        try {
            await conn.query(stmt);
            console.log('OK  [' + (i + 1) + '/' + statements.length + '] ' + preview);
        } catch (e) {
            console.log('ERR [' + (i + 1) + '/' + statements.length + '] ' + preview);
            console.log('     -> ' + e.message);
        }
    }

    console.log('\nVerificação final:');
    const [tables] = await conn.query('SHOW TABLES FROM `' + DB + '`');
    const key = 'Tables_in_' + DB;
    for (const t of tables) {
        const [c] = await conn.query('SELECT COUNT(*) c FROM `' + DB + '`.`' + t[key] + '`');
        console.log('  - ' + t[key] + ' (' + c[0].c + ' linhas)');
    }

    await conn.end();
}

restore().catch(e => { console.error('Erro:', e.message); process.exit(1); });