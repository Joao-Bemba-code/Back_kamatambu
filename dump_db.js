require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function dump() {
    const conn = await mysql.createConnection({
        host: process.env.Host_database,
        user: process.env.User_database,
        password: process.env.Pass_database,
        database: process.env.Name_database,
        port: parseInt(process.env.Port) || 4000,
        ssl: { rejectUnauthorized: false },
        connectTimeout: 60000
    });

    console.log("Ligado à base de dados!");

    const [tables] = await conn.query("SHOW TABLES");
    const tableKey = `Tables_in_${process.env.Name_database}`;
    const tableNames = tables.map(t => t[tableKey]);

    console.log(`Tabelas encontradas: ${tableNames.length}`);
    console.log(tableNames.join(', '));

    let sql = `-- Dump da base de dados: ${process.env.Name_database}\n`;
    sql += `-- Data: ${new Date().toISOString()}\n`;
    sql += `-- Tabelas: ${tableNames.length}\n\n`;
    sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const table of tableNames) {
        console.log(`A exportar: ${table}...`);

        const [createRows] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
        const createSQL = createRows[0]['Create Table'];
        sql += `-- Tabela: ${table}\n`;
        sql += `DROP TABLE IF EXISTS \`${table}\`;\n`;
        sql += `${createSQL};\n\n`;

        const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
        if (rows.length > 0) {
            const cols = Object.keys(rows[0]);
            for (const row of rows) {
                const vals = cols.map(c => {
                    const v = row[c];
                    if (v === null) return 'NULL';
                    if (typeof v === 'number') return v;
                    if (Buffer.isBuffer(v)) return `X'${v.toString('hex')}'`;
                    return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
                });
                sql += `INSERT INTO \`${table}\` (${cols.map(c => `\`${c}\``).join(', ')}) VALUES (${vals.join(', ')});\n`;
            }
            console.log(`  -> ${rows.length} linhas exportadas`);
        } else {
            console.log(`  -> tabela vazia`);
        }
        sql += '\n';
    }

    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    const outPath = path.join(__dirname, '..', `dump_${process.env.Name_database}_${new Date().toISOString().slice(0,10)}.sql`);
    fs.writeFileSync(outPath, sql, 'utf8');
    console.log(`\nDump guardado em: ${outPath}`);
    console.log(`Tamanho: ${(Buffer.byteLength(sql) / 1024).toFixed(1)} KB`);

    await conn.end();
}

dump().catch(e => { console.error("Erro:", e.message); process.exit(1); });
