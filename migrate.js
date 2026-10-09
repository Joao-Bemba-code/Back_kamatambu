// Migração automática executada no arranque (node index.js)
// 1) ALTERs idempotentes para colunas críticas
// 2) sequelize.sync({ alter: true }) actualiza todas as tabelas a partir dos modelos
var { sequelize } = require("./config/index.js");
require("./models/index.js");

var migracoes = [
    {
        nome: "Produtos.controla_stock",
        sql: "ALTER TABLE `Produtos` ADD COLUMN IF NOT EXISTS `controla_stock` TINYINT(1) NOT NULL DEFAULT 1"
    },
    {
        nome: "Movimentos.ativo",
        sql: "ALTER TABLE `Movimentos` ADD COLUMN IF NOT EXISTS `ativo` TINYINT(1) NOT NULL DEFAULT 1"
    }
];

async function migrar() {
    console.log("== Migração automática da base de dados ==");

    for (var i = 0; i < migracoes.length; i++) {
        try {
            await sequelize.query(migracoes[i].sql);
            console.log(`OK ${migracoes[i].nome}`);
        } catch (error) {
            console.log(`Falha ${migracoes[i].nome}: ${error.message}`);
        }
    }

    try {
        await sequelize.sync({ alter: true });
        console.log("OK Tabelas sincronizadas com os modelos");
    } catch (error) {
        console.log(`Falha na sincronização dos modelos: ${error.message}`);
    }

    console.log("== Migração concluída ==");
}

module.exports = { migrar };
