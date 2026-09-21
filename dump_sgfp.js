require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB = 'sgfp';

async function dump() {
    const conn = await mysql.createConnection({
        host: 'serverless-us-central1.sysp0000.db2.skysql.com',
        user: 'dbpgf15926154',
        password: '6]9d*7ReZZjh2vGScR0SN',
        port: 4054,
        database: DB,
        ssl: { rejectUnauthorized: false },
        connectTimeout: 120000,
        enableKeepAlive: true
    });

    console.log('Ligado à ' + DB + '!');

    const [tables] = await conn.query('SHOW TABLES FROM `' + DB + '`');
    const key = 'Tables_in_' + DB;
    const tableNames = tables.map(t => t[key]);

    console.log('Tabelas (' + tableNames.length + '): ' + tableNames.join(', '));

    let sql = '-- Dump da base: ' + DB + '\n';
    sql += '-- Data: ' + new Date().toISOString() + '\n';
    sql += 'SET FOREIGN_KEY_CHECKS = 0;\n\n';

    let totalRows = 0;
    for (const table of tableNames) {
        try {
            const [c] = await conn.query('SELECT COUNT(*) c FROM `' + DB + '`.`' + table + '`');
            console.log('-> ' + table + ' (' + c[0].c + ' linhas)');
        } catch (e) {
            console.log('-> ' + table + ' (erro a contar)');
        }

        try {
            const [cols] = await conn.query('SHOW COLUMNS FROM `' + DB + '`.`' + table + '`');
            const colDefs = cols.map(x => {
                let d = '`' + x.Field + '` ' + x.Type;
                if (x.Null === 'YES') { d += ' NULL'; } else { d += ' NOT NULL'; }
                if (x.Default !== null && x.Default !== undefined) {
                    if (['CURRENT_TIMESTAMP', 'current_timestamp()'].includes(String(x.Default))) {
                        d += ' DEFAULT ' + String(x.Default);
                    } else {
                        d += " DEFAULT '" + String(x.Default).replace(/'/g, "''") + "'";
                    }
                }
                if (x.Extra) { d += ' ' + x.Extra; }
                return d;
            });
            const pk = cols.filter(x => x.Key === 'PRI').map(x => '`' + x.Field + '`');
            sql += 'DROP TABLE IF EXISTS `' + table + '`;\n';
            sql += 'CREATE TABLE `' + table + '` (\n  ' + colDefs.join(',\n  ');
            if (pk.length > 0) { sql += ',\n  PRIMARY KEY (' + pk.join(', ') + ')'; }
            sql += '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n';
        } catch (e) {
            console.log('   erro SHOW CREATE:', e.message);
        }

        try {
            const [rows] = await conn.query('SELECT * FROM `' + DB + '`.`' + table + '`', [], { timeout: 300000 });
            if (rows.length > 0) {
                const colNames = Object.keys(rows[0]);
                for (let i = 0; i < rows.length; i += 500) {
                    const chunk = rows.slice(i, i + 500);
                    for (const row of chunk) {
                        const vals = colNames.map(cname => {
                            const v = row[cname];
                            if (v === null || v === undefined) return 'NULL';
                            if (v instanceof Date) return "'" + v.toISOString().slice(0, 19).replace('T', ' ') + "'";
                            if (Buffer.isBuffer(v)) return "X'" + v.toString('hex') + "'";
                            if (typeof v === 'number') return String(v);
                            if (typeof v === 'boolean') return v ? '1' : '0';
                            return "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
                        });
                        sql += 'INSERT INTO `' + table + '` (`' + colNames.join('`, `') + '`) VALUES (' + vals.join(', ') + ');\n';
                    }
                    sql += '\n';
                }
                totalRows += rows.length;
                console.log('   ' + rows.length + ' linhas exportadas');
            }
        } catch (e) {
            console.log('   erro SELECT:', e.message);
        }
    }

    sql += 'SET FOREIGN_KEY_CHECKS = 1;\n';

    const outPath = path.join('C:\\Users\\PC\\Documents\\projecto_gest_alter', 'dump_' + DB + '_' + new Date().toISOString().slice(0, 10) + '.sql');
    fs.writeFileSync(outPath, sql, 'utf8');
    console.log('\nDump guardado em: ' + outPath);
    console.log('Total de linhas: ' + totalRows);
    console.log('Tamanho: ' + (Buffer.byteLength(sql) / 1024).toFixed(1) + ' KB');

    await conn.end();
}

dump().catch(e => { console.error('Erro:', e.message); process.exit(1); });