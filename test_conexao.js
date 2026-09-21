require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function main() {
    const opts = {
        host: process.env.Host_database,
        user: process.env.User_database,
        password: process.env.Pass_database,
        port: parseInt(process.env.Port) || 4054,
        connectTimeout: 60000
    };
    const attempts = [
        { name: 'sem SSL', o: opts },
        { name: 'com SSL', o: { ...opts, ssl: { rejectUnauthorized: false } } }
    ];
    for (const a of attempts) {
        try {
            const conn = await mysql.createConnection(a.o);
            const [r] = await conn.query("SELECT VERSION() v");
            console.log('Conectado (' + a.name + ')! Versão:', r[0].v);
            const [dbs] = await conn.query("SHOW DATABASES");
            console.log('Bases:', dbs.map(d => d.Database).join(', '));
            try {
                const [t] = await conn.query("SHOW TABLES FROM sgfp");
                const key = 'Tables_in_sgfp';
                console.log('sgfp tem ' + t.length + ' tabelas:');
                for (const r2 of t) {
                    const [c] = await conn.query("SELECT COUNT(*) c FROM `sgfp`.`" + r2[key] + "`");
                    console.log('  - ' + r2[key] + ' (' + c[0].c + ' linhas)');
                }
            } catch (e) {
                console.log('Erro tabelas sgfp:', e.message);
            }
            await conn.end();
            return;
        } catch (e) {
            console.log(a.name + ' falhou:', e.message);
        }
    }
}

main().catch(e => process.exit(1));