var dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

var mysql = require('mysql2/promise');

async function addVendaPagamento() {
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
            ALTER TABLE \`Pagamentos\`
            MODIFY \`tipo\` ENUM('matricula','mensalidade','certificado','taxa','venda','outro') NOT NULL DEFAULT 'mensalidade'
        `);
        console.log("ENUM tipo atualizado (adicionado 'venda')!");

        await conn.execute(`
            ALTER TABLE \`Pagamentos\`
            MODIFY \`aluno\` VARCHAR(100) NULL
        `);
        console.log("Coluna aluno agora aceita NULL!");

        await conn.execute(`
            ALTER TABLE \`Pagamentos\`
            MODIFY \`curso\` VARCHAR(100) NULL
        `);
        console.log("Coluna curso agora aceita NULL!");
    } catch (error) {
        console.error("Erro na migracao:", error.message);
    } finally {
        await conn.end();
    }
}

addVendaPagamento();
