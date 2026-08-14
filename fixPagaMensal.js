var mysql = require('mysql2/promise');
var dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

(async () => {
    var conn = await mysql.createConnection({
        host: process.env.Host_database,
        user: process.env.User_database,
        password: process.env.Pass_database,
        database: process.env.Name_database,
        port: 4054,
        ssl: { rejectUnauthorized: false }
    });

    await conn.execute("UPDATE Cursos SET paga_mensal = 'sim' WHERE LOWER(Nome) IN ('english', 'inglês')");
    
    var [rows] = await conn.execute("SELECT id, Nome, paga_mensal FROM Cursos WHERE paga_mensal = 'sim'");
    console.log('Cursos com paga_mensal = sim:');
    rows.forEach(r => console.log('  id=' + r.id + ' Nome=' + r.Nome));

    await conn.end();
    console.log('Done!');
})();
