const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'serverless-us-central1.sysp0000.db2.skysql.com',
    port: 4054,
    user: 'dbpgf15926154',
    password: '6]9d*7ReZZjh2vGScR0SN',
    database: 'sgfp',
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
