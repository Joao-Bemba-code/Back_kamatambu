require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function main() {
    const conn = await mysql.createConnection({
        host: process.env.Host_database,
        user: process.env.User_database,
        password: process.env.Pass_database,
        port: parseInt(process.env.Port) || 4000,
        ssl: { rejectUnauthorized: false },
        connectTimeout: 60000
    });

    // Tentar criar uma database nova de app
    const dbName = 'sgfp_app';
    try {
        await conn.query('CREATE DATABASE IF NOT EXISTS `' + dbName + '`');
        console.log('Database "' + dbName + '" criada (ou já existe) com sucesso!');

        // testar CREATE TABLE dentro dela
        await conn.query('DROP TABLE IF EXISTS `' + dbName + '`.`test_permission`');
        await conn.query('CREATE TABLE `' + dbName + '`.`test_permission` (id int)');
        console.log('CREATE TABLE funcionou em "' + dbName + '"');
        await conn.query('DROP TABLE `' + dbName + '`.`test_permission`');
    } catch (e) {
        console.log('Falhou em "' + dbName + '":', e.message);
    }

    // testar na database test
    try {
        await conn.query('CREATE DATABASE IF NOT EXISTS `test`');
        await conn.query('DROP TABLE IF EXISTS `test`.`test_permission`');
        await conn.query('CREATE TABLE `test`.`test_permission` (id int)');
        console.log('CREATE TABLE funcionou em "test"');
        await conn.query('DROP TABLE `test`.`test_permission`');
    } catch (e) {
        console.log('Falhou em "test":', e.message);
    }

    await conn.end();
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1); });