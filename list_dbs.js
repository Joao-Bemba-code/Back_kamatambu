require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function listDBs() {
    const conn = await mysql.createConnection({
        host: process.env.Host_database,
        user: process.env.User_database,
        password: process.env.Pass_database,
        port: parseInt(process.env.Port) || 4000,
        ssl: { rejectUnauthorized: false },
        connectTimeout: 60000
    });

    const [rows] = await conn.query("SHOW DATABASES");
    console.log("Bases de dados disponíveis:");
    for (const row of rows) {
        console.log(`  - ${row.Database}`);
    }

    // For each non-system DB, show tables
    const skip = ['information_schema', 'mysql', 'performance_schema', 'sys', 'metrics_schema'];
    for (const row of rows) {
        if (!skip.includes(row.Database)) {
            const [tables] = await conn.query(`SHOW TABLES FROM \`${row.Database}\``);
            const tableKey = `Tables_in_${row.Database}`;
            console.log(`\n${row.Database} (${tables.length} tabelas):`);
            for (const t of tables) {
                const [count] = await conn.query(`SELECT COUNT(*) as c FROM \`${row.Database}\`.\`${t[tableKey]}\``);
                console.log(`  - ${t[tableKey]} (${count[0].c} linhas)`);
            }
        }
    }

    await conn.end();
}

listDBs().catch(e => { console.error("Erro:", e.message); process.exit(1); });
