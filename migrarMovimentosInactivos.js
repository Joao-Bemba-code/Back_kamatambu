var dotenv = require("dotenv");
dotenv.config();

var { Sequelize, sequelize } = require("./config/index.js");
var { Produtos, Movimentos } = require("./models/index.js");

(async function () {
    try {
        var inactivos = await Produtos.findAll({ where: { ativo: false }, attributes: ["id", "nome"] });

        if (inactivos.length === 0) {
            console.log("Nenhum produto inactivo encontrado.");
            return process.exit(0);
        }

        for (var p of inactivos) {
            var [n] = await Movimentos.update({ ativo: false }, { where: { produto_id: p.id, ativo: true } });
            console.log(`Produto ${p.id} (${p.nome}): ${n} movimento(s) marked as inactivo`);
        }

        console.log("Migracao concluida.");
        process.exit(0);
    } catch (e) {
        console.error("Erro na migracao:", e.message);
        process.exit(1);
    }
})();
