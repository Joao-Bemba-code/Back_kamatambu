var dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

var mysql = require('mysql2/promise');

async function addReservadaStatus() {
    var conn = await mysql.createConnection({
        host: process.env.Host_database,
        user: process.env.User_database,
        password: process.env.Pass_database,
        database: process.env.Name_database,
        port: parseInt(process.env.Port) || 4000,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await conn.execute("ALTER TABLE `Salas` MODIFY COLUMN `Status` ENUM('Disponível','Ocupada','Em manutenção','Reservada') NOT NULL DEFAULT 'Disponível'");
        console.log("Status 'Reservada' adicionado ao ENUM da tabela Salas!");
    } catch (error) {
        console.error("Erro na migracao:", error.message);
        process.exit(1);
    } finally {
        await conn.end();
    }
}

addReservadaStatus();