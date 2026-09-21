require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');

const dumpFile = process.argv[2] || 'C:\\Users\\PC\\Documents\\projecto_gest_alter\\dump_sgfp_2026-09-01.sql';
const DB = 'sgfp';

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

    console.log('Ligado à TiDB (database: ' + DB + ')!');

    const sql = fs.readFileSync(dumpFile, 'utf8').replace(/\r/g, '');

    const statements = sql
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SET FOREIGN'));

    console.log('Statements: ' + statements.length);

    // Agrupar: tabela atual para progresso
    let currentTable = '';
    let ok = 0, err = 0, rows = 0;

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        let m = stmt.match(/^CREATE TABLE `(\w+)`/);
        if (m) {
            currentTable = m[1];
            console.log('\n== Tabela: ' + currentTable + ' ==');
        } else {
            m = stmt.match(/^INSERT INTO `(\w+)`/);
            if (m && m[1] !== currentTable) {
                currentTable = m[1];
                console.log('\n== Tabela: ' + currentTable + ' ==');
            }
        }
        try {
            await conn.query(stmt);
            ok++;
            if (stmt.startsWith('INSERT')) rows++;
        } catch (e) {
            err++;
            console.log('  ERR [' + (i + 1) + '/' + statements.length + '] ' + stmt.replace(/\s+/g, ' ').slice(0, 100));
            console.log('     -> ' + e.message);
        }
    }

    console.log('\n\nOK: ' + ok + ' | Erros: ' + err + ' | Inserts: ' + rows);

    console.log('\nVerificação final:');
    const [tables] = await conn.query('SHOW TABLES FROM `' + DB + '`');
    const key = 'Tables_in_' + DB;
    for (const t of tables) {
        try {
            const [c] = await conn.query('SELECT COUNT(*) c FROM `' + DB + '`.`' + t[key] + '`');
            console.log('  - ' + t[key] + ' (' + c[0].c + ' linhas)');
        } catch (e) {
            console.log('  - ' + t[key] + ' (erro: ' + e.message + ')');
        }
    }

    await conn.end();
}

restore().catch(e => { console.error('Erro:', e.message); process.exit(1); });