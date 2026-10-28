var dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

var mysql = require('mysql2/promise');

async function verificar() {
    var conn = await mysql.createConnection({
        host: process.env.Host_database,
        user: process.env.User_database,
        password: process.env.Pass_database,
        database: process.env.Name_database,
        port: parseInt(process.env.Port) || 4000,
        ssl: { rejectUnauthorized: false }
    });

    try {
        var [cols] = await conn.execute("SHOW COLUMNS FROM `Matriculas` LIKE 'Telefone'");
        console.log("Coluna Telefone:", JSON.stringify(cols[0]));
        var [rows] = await conn.execute("SELECT COUNT(*) AS total FROM `Matriculas`");
        console.log("Total de matriculas na tabela:", rows[0].total);
        var [max] = await conn.execute("SELECT MAX(LENGTH(Telefone)) AS maior FROM `Matriculas`");
        console.log("Maior Telefone existente (caracteres):", max[0].maior);
    } catch (error) {
        console.error("Erro na verificacao:", error.message);
        process.exit(1);
    } finally {
        await conn.end();
    }
}

verificar();
