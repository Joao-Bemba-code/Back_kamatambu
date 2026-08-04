var dotenv = require('dotenv');
dotenv.config({path: __dirname + '/.env'});

var { Name_database, User_database, Pass_database, Host_database } = process.env;

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const PADRAO_SENHA = 'kamatambu1234';

async function colunaExiste(conn, tabela, coluna) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS total FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [Name_database, tabela, coluna]
  );
  return rows[0].total > 0;
}

async function enumContemValor(conn, tabela, coluna, valor) {
  const [rows] = await conn.execute(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [Name_database, tabela, coluna]
  );
  if (!rows.length) return false;
  return rows[0].COLUMN_TYPE.includes(`'${valor}'`);
}

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
    // 1) Coluna Telefone
    if (!(await colunaExiste(conn, 'Users', 'Telefone'))) {
      await conn.execute('ALTER TABLE Users ADD COLUMN Telefone VARCHAR(255) NULL');
      console.log('Coluna Telefone adicionada.');
    } else {
      console.log('Coluna Telefone ja existe.');
    }

    // 2) Coluna formador_id
    if (!(await colunaExiste(conn, 'Users', 'formador_id'))) {
      await conn.execute('ALTER TABLE Users ADD COLUMN formador_id INT NULL');
      console.log('Coluna formador_id adicionada.');
    } else {
      console.log('Coluna formador_id ja existe.');
    }

    // 3) ENUM tipo incluir 'formador'
    if (!(await enumContemValor(conn, 'Users', 'tipo', 'formador'))) {
      await conn.execute("ALTER TABLE Users MODIFY COLUMN tipo ENUM('admin','pedagogico','tesouraria','recursos_humanos','pendente','formador') NOT NULL DEFAULT 'pendente'");
      console.log('ENUM tipo atualizado com formador.');
    } else {
      console.log('ENUM tipo ja contem formador.');
    }

    // 4) Criar Users para formadores existentes sem conta
    const [formadores] = await conn.execute('SELECT id, Nome, Email, Telefone FROM Formadores');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(PADRAO_SENHA, salt);

    let criados = 0;
    let atualizados = 0;
    for (const f of formadores) {
      const [users] = await conn.execute('SELECT id FROM Users WHERE formador_id = ? LIMIT 1', [f.id]);
      const telefone = f.Telefone ? String(f.Telefone).trim() : null;
      const email = f.Email ? String(f.Email).trim().toLowerCase() : null;

      if (users.length > 0) {
        if (telefone || email) {
          await conn.execute(
            'UPDATE Users SET Nome = ?, Telefone = ?, Email = ?, tipo = ? WHERE formador_id = ?',
            [f.Nome, telefone, email, 'formador', f.id]
          );
          atualizados++;
        }
        continue;
      }

      let userExistente = null;
      if (email) {
        const [u] = await conn.execute('SELECT id FROM Users WHERE Email = ? LIMIT 1', [email]);
        if (u.length) userExistente = u[0].id;
      }
      if (!userExistente && telefone) {
        const [u] = await conn.execute('SELECT id FROM Users WHERE Telefone = ? LIMIT 1', [telefone]);
        if (u.length) userExistente = u[0].id;
      }

      if (userExistente) {
        await conn.execute(
          'UPDATE Users SET Nome = ?, Telefone = ?, formador_id = ?, tipo = ? WHERE id = ?',
          [f.Nome, telefone, f.id, 'formador', userExistente]
        );
        atualizados++;
      } else {
        await conn.execute(
          'INSERT INTO Users (Nome, Email, Telefone, Senha, eAdmin, formador_id, tipo, createdAt, updatedAt) VALUES (?, ?, ?, ?, 0, ?, ?, NOW(), NOW())',
          [f.Nome, email, telefone, hash, f.id, 'formador']
        );
        criados++;
      }
    }
    console.log(`Users de formadores: ${criados} criados, ${atualizados} atualizados.`);

  } catch (e) {
    console.error('Erro:', e.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
    console.log('Migracao concluida.');
  }
})();
