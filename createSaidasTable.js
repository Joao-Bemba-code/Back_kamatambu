var dotenv = require('dotenv');
dotenv.config();

var mysql = require('mysql2/promise');

async function createSaidasTable() {
    var conn = await mysql.createConnection({
        host: process.env.Host_database,
        user: process.env.User_database,
        password: process.env.Pass_database,
        database: process.env.Name_database,
        port: 4054,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS \`Saidas\` (
                \`id\` INTEGER NOT NULL AUTO_INCREMENT,
                \`descricao\` VARCHAR(200) NOT NULL,
                \`tipo\` ENUM('salario','aluguel','material','equipamento','servico','energia','agua','internet','manutencao','imposto','outro') NOT NULL DEFAULT 'outro',
                \`valor\` DECIMAL(10,2) NOT NULL,
                \`data_saida\` DATE NOT NULL,
                \`status\` ENUM('pago','pendente','cancelado') NOT NULL DEFAULT 'pago',
                \`forma_pagamento\` ENUM('dinheiro','transferencia','deposito','multicaixa') NOT NULL DEFAULT 'dinheiro',
                \`observacao\` TEXT,
                \`usuario_criou\` VARCHAR(100),
                \`createdAt\` DATETIME NOT NULL,
                \`updatedAt\` DATETIME NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("Tabela Saidas criada com sucesso!");
    } catch (error) {
        console.error("Erro ao criar tabela Saidas:", error.message);
    } finally {
        await conn.end();
    }
}

createSaidasTable();
