const { Sequelize, sequelize } = require("../config/index.js");

const CriteriosAvaliacao = sequelize.define("CriteriosAvaliacao", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: { notEmpty: { msg: "O nome do critério é obrigatório" } }
    },
    indicador: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: { notEmpty: { msg: "O indicador é obrigatório" } }
    },
    peso: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0, max: 100 }
    },
    instrumento: {
        type: Sequelize.STRING(200),
        allowNull: false,
        validate: { notEmpty: { msg: "O instrumento de avaliação é obrigatório" } }
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = CriteriosAvaliacao;
