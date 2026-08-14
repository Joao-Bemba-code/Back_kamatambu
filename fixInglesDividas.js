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

    // Curso Inglês: o curso tem 4 módulos/meses (paga_mensal = 'sim'),
    // o valor de cada mensalidade é o Valor_curso (8000 Kz/mês).
    await conn.execute("UPDATE Cursos SET Modulos = 4 WHERE id = 11");

    // Pagamento id=40 (Conceição Agostinho Vieira): associar à matrícula
    // (aluno_id = 35) e corrigir a data de vencimento para o mês de
    // referência correto (julho/2026, vencimento dia 5).
    await conn.execute("UPDATE Pagamentos SET aluno_id = 35, data_vencimento = '2026-07-05' WHERE id = 40");

    var [c] = await conn.execute("SELECT id, Nome, Modulos, Valor_curso, paga_mensal FROM Cursos WHERE id = 11");
    console.log('Curso Inglês:', JSON.stringify(c, null, 2));

    var [p] = await conn.execute("SELECT id, aluno, aluno_id, valor, status, data_pagamento, data_vencimento FROM Pagamentos WHERE id = 40");
    console.log('Pagamento 40:', JSON.stringify(p, null, 2));

    await conn.end();
    console.log('Done!');
})();
