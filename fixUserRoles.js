var dotenv = require('dotenv');
dotenv.config({path: __dirname + '/.env'});

var { Name_database, User_database, Pass_database, Host_database } = process.env;

const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: Host_database,
    port: 4054,
    user: User_database,
    password: Pass_database,
    database: Name_database,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await conn.execute("ALTER TABLE Users MODIFY COLUMN tipo ENUM('admin','pedagogico','tesouraria','pendente') DEFAULT 'pendente'");
    console.log('Default da coluna tipo alterado para pendente');
  } catch (e) {
    console.log('Erro ao alterar default:', e.message);
  }

  const [users] = await conn.execute("SELECT id, Nome, Email, eAdmin, tipo FROM Users");
  console.log('Users ANTES:', JSON.stringify(users, null, 2));

  for (const u of users) {
    if (u.eAdmin && u.tipo !== 'admin') {
      await conn.execute("UPDATE Users SET tipo = 'admin' WHERE id = ?", [u.id]);
      console.log(`  ${u.Nome} -> admin (eAdmin=true)`);
    } else if (!u.eAdmin && u.tipo === 'admin') {
      await conn.execute("UPDATE Users SET tipo = 'pedagogico' WHERE id = ?", [u.id]);
      console.log(`  ${u.Nome} -> pedagogico (era admin mas eAdmin=false)`);
    }
  }

  const [after] = await conn.execute("SELECT id, Nome, Email, eAdmin, tipo FROM Users");
  console.log('Users DEPOIS:', JSON.stringify(after, null, 2));

  await conn.end();
  console.log('Feito!');
})().catch(e => { console.error('Erro:', e.message); process.exit(1); });
