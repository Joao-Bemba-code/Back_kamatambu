const { Sequelize, sequelize } = require("../config/index.js");

const Saidas = sequelize.define("Saidas", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    descricao: {
        type: Sequelize.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: "A descrição é obrigatória" }
        }
    },
    tipo: {
        type: Sequelize.ENUM("salario", "aluguel", "material", "equipamento", "servico", "energia", "agua", "internet", "manutencao", "imposto", "outro"),
        allowNull: false,
        defaultValue: "outro"
    },
    valor: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0,
            notEmpty: { msg: "O valor é obrigatório" }
        }
    },
    data_saida: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    status: {
        type: Sequelize.ENUM("pago", "pendente", "cancelado"),
        allowNull: false,
        defaultValue: "pago"
    },
    forma_pagamento: {
        type: Sequelize.ENUM("dinheiro", "transferencia", "deposito", "multicaixa"),
        allowNull: false,
        defaultValue: "dinheiro"
    },
    observacao: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    usuario_criou: {
        type: Sequelize.STRING(100),
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = Saidas;
