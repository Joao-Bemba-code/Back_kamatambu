var dotenv = require('dotenv');
dotenv.config();

var mysql = require('mysql2/promise');

async function createAlugueresTable() {
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
            CREATE TABLE IF NOT EXISTS \`Alugueres\` (
                \`id\` INTEGER NOT NULL AUTO_INCREMENT,
                \`sala_id\` INTEGER,
                \`Sala\` VARCHAR(50) NOT NULL,
                \`Cliente\` VARCHAR(100) NOT NULL,
                \`Telefone\` VARCHAR(30),
                \`Data_Inicio\` DATE NOT NULL,
                \`Data_Fim\` DATE NOT NULL,
                \`Valor\` DECIMAL(10,2) NOT NULL,
                \`Tipo_Cobranca\` ENUM('hora','dia') NOT NULL DEFAULT 'dia',
                \`Duracao\` DECIMAL(10,2) NOT NULL DEFAULT 1,
                \`Status\` ENUM('pago','pendente','parcial','cancelado') NOT NULL DEFAULT 'pendente',
                \`Forma_Pagamento\` ENUM('dinheiro','transferencia','deposito','multicaixa') NOT NULL DEFAULT 'dinheiro',
                \`Observacao\` TEXT,
                \`Usuario_Criou\` VARCHAR(100),
                \`createdAt\` DATETIME NOT NULL,
                \`updatedAt\` DATETIME NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("Tabela Alugueres criada com sucesso!");
    } catch (error) {
        console.error("Erro ao criar tabela Alugueres:", error.message);
    } finally {
        await conn.end();
    }
}

createAlugueresTable();