var dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

var mysql = require('mysql2/promise');

async function addPrecoSalasColumns() {
    var conn = await mysql.createConnection({
        host: process.env.Host_database,
        user: process.env.User_database,
        password: process.env.Pass_database,
        database: process.env.Name_database,
        port: parseInt(process.env.Port) || 4000,
        ssl: { rejectUnauthorized: false }
    });

    try {
        try {
            await conn.execute("ALTER TABLE `Salas` ADD COLUMN `Preco_Hora` DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER `Localizacao`");
            console.log("Coluna Preco_Hora adicionada na tabela Salas!");
        } catch (e) {
            if (String(e.message).includes('Duplicate column')) console.log('Preco_Hora ja existe.');
            else throw e;
        }

        try {
            await conn.execute("ALTER TABLE `Salas` ADD COLUMN `Preco_Dia` DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER `Preco_Hora`");
            console.log("Coluna Preco_Dia adicionada na tabela Salas!");
        } catch (e) {
            if (String(e.message).includes('Duplicate column')) console.log('Preco_Dia ja existe.');
            else throw e;
        }

        try {
            await conn.execute("ALTER TABLE `Alugueres` ADD COLUMN `Tipo_Cobranca` ENUM('hora','dia') NOT NULL DEFAULT 'dia' AFTER `Valor`");
            console.log("Coluna Tipo_Cobranca adicionada na tabela Alugueres!");
        } catch (e) {
            if (String(e.message).includes('Duplicate column')) console.log('Tipo_Cobranca ja existe.');
            else throw e;
        }

        try {
            await conn.execute("ALTER TABLE `Alugueres` ADD COLUMN `Duracao` DECIMAL(10,2) NOT NULL DEFAULT 1 AFTER `Tipo_Cobranca`");
            console.log("Coluna Duracao adicionada na tabela Alugueres!");
        } catch (e) {
            if (String(e.message).includes('Duplicate column')) console.log('Duracao ja existe.');
            else throw e;
        }
    } catch (error) {
        console.error("Erro na migracao:", error.message);
        process.exit(1);
    } finally {
        await conn.end();
    }
}

addPrecoSalasColumns();