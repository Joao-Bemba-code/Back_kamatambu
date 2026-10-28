var dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

var mysql = require('mysql2/promise');

async function addTelefoneMaior() {
    var conn = await mysql.createConnection({
        host: process.env.Host_database,
        user: process.env.User_database,
        password: process.env.Pass_database,
        database: process.env.Name_database,
        port: parseInt(process.env.Port) || 4000,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Telefone passa a aceitar dois numeros (ex: "923382658 / 923382466")
        await conn.execute("ALTER TABLE `Matriculas` MODIFY COLUMN `Telefone` varchar(50) NOT NULL");
        console.log("Coluna Telefone da tabela Matriculas alargada para varchar(50)!");
    } catch (error) {
        console.error("Erro na migracao:", error.message);
        process.exit(1);
    } finally {
        await conn.end();
    }
}

addTelefoneMaior();
