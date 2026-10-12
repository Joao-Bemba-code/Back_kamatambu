var dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

var mysql = require('mysql2/promise');

async function columnExists(conn, tabela, coluna) {
    var [rows] = await conn.query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS " +
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
        [tabela, coluna]
    );
    return rows.length > 0;
}

(async () => {
    var conn = await mysql.createConnection({
        host: process.env.Host_database,
        user: process.env.User_database,
        password: process.env.Pass_database,
        database: process.env.Name_database,
        port: parseInt(process.env.Port) || 4000,
        ssl: { rejectUnauthorized: false }
    });

    try {
        if (await columnExists(conn, 'Produtos', 'controla_stock')) {
            console.log('Produtos.controla_stock jÃ¡ existe.');
        } else {
            await conn.query("ALTER TABLE `Produtos` ADD COLUMN `controla_stock` TINYINT(1) NOT NULL DEFAULT 1");
            console.log('Produtos.controla_stock adicionada.');
        }

        if (await columnExists(conn, 'Movimentos', 'ativo')) {
            console.log('Movimentos.ativo jÃ¡ existe.');
        } else {
            await conn.query("ALTER TABLE `Movimentos` ADD COLUMN `ativo` TINYINT(1) NOT NULL DEFAULT 1");
            console.log('Movimentos.ativo adicionada.');
        }
    } catch (error) {
        console.error('Erro na migraÃ§Ã£o:', error.message);
        process.exitCode = 1;
    } finally {
        await conn.end();
    }
})();