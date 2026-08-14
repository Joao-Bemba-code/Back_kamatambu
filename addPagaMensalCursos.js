var dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

var mysql = require('mysql2/promise');

async function addPagaMensalCursos() {
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
            ALTER TABLE \`Cursos\`
            ADD COLUMN \`paga_mensal\` ENUM('sim', 'nao') NOT NULL DEFAULT 'nao'
        `);
        console.log("Coluna paga_mensal adicionada com sucesso!");
    } catch (error) {
        if (error.message.includes('Duplicate column')) {
            console.log("Coluna paga_mensal ja existe.");
        } else {
            throw error;
        }
    }

    await conn.execute(`
        UPDATE \`Cursos\` SET \`paga_mensal\` = 'sim' WHERE LOWER(\`Nome\`) IN ('english', 'inglês')
    `);
    console.log("Curso 'english' definido com paga_mensal = 'sim'.");

    await conn.end();
    console.log('Feito!');
}

addPagaMensalCursos().catch(e => { console.error('Erro:', e.message); process.exit(1); });
