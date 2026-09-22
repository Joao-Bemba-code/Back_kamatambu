var dotenv = require('dotenv');
dotenv.config();

var mysql = require('mysql2/promise');

async function createSalasTable() {
    var conn = await mysql.createConnection({
        host: process.env.Host_database,
        user: process.env.User_database,
        password: process.env.Pass_database,
        database: process.env.Name_database,
        port: parseInt(process.env.Port) || 4000,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS \`Salas\` (
                \`id\` INTEGER NOT NULL AUTO_INCREMENT,
                \`Nome\` VARCHAR(50) NOT NULL,
                \`Capacidade\` INTEGER NOT NULL DEFAULT 20,
                \`Localizacao\` VARCHAR(100),
                \`Preco_Hora\` DECIMAL(10,2) NOT NULL DEFAULT 0,
                \`Preco_Dia\` DECIMAL(10,2) NOT NULL DEFAULT 0,
                \`Status\` ENUM('Disponível','Ocupada','Em manutenção','Reservada') NOT NULL DEFAULT 'Disponível',
                \`createdAt\` DATETIME NOT NULL,
                \`updatedAt\` DATETIME NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("Tabela Salas criada com sucesso!");
    } catch (error) {
        console.error("Erro ao criar tabela Salas:", error.message);
    } finally {
        await conn.end();
    }
}

createSalasTable();