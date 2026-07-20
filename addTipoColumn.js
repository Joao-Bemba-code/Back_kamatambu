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
    await conn.execute("ALTER TABLE Users ADD COLUMN tipo ENUM('admin','pedagogico','tesouraria') DEFAULT 'admin'");
    console.log('Coluna tipo adicionada com sucesso!');
  } catch (e) {
    if (e.message.includes('Duplicate column')) {
      console.log('Coluna tipo ja existe.');
    } else {
      throw e;
    }
  }

  await conn.execute("UPDATE Users SET tipo = 'admin' WHERE tipo IS NULL");
  console.log('Users existentes definidos como admin.');

  const [rows] = await conn.execute("SELECT id, Nome, Email, eAdmin, tipo FROM Users");
  console.log('Users:', JSON.stringify(rows, null, 2));

  await conn.end();
  console.log('Feito!');
})().catch(e => { console.error('Erro:', e.message); process.exit(1); });
