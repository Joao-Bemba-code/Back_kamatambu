const Users = require("./Users.js");
const Formadores = require("./Formadores.js");
const Matriculas = require("./Matriculas.js");
const Turmas = require("./Turmas.js");
const Cursos = require("./Cursos.js");
const Pagamentos = require("./Pagamentos.js");
const Notas = require("./Notas.js");
const Frequencia = require("./Frequencia.js");
const Boletim = require("./Boletim.js");
const CriteriosAvaliacao = require("./CriteriosAvaliacao.js");
const Saidas = require("./Saidas.js");
const Salas = require("./Salas.js");
const Alugueres = require("./Alugueres.js");
const Produtos = require("./Produtos.js");
const Movimentos = require("./Movimentos.js");
const Requisicoes = require("./Requisicoes.js");
const RequisicaoItens = require("./RequisicaoItens.js");

Requisicoes.hasMany(RequisicaoItens, { as: "itens", foreignKey: "requisicao_id" });

module.exports = {
    Users,
    Formadores,
    Matriculas,
    Turmas,
    Cursos,
    Pagamentos,
    Notas,
    Frequencia,
    Boletim,
    CriteriosAvaliacao,
    Saidas,
    Salas,
    Alugueres,
    Produtos,
    Movimentos,
    Requisicoes,
    RequisicaoItens
};