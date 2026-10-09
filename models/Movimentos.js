const { Sequelize, sequelize } = require("../config/index.js");

const Movimentos = sequelize.define("Movimentos", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    produto_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: { msg: "O produto é obrigatório" }
        }
    },
    produto_nome: {
        type: Sequelize.STRING(150),
        allowNull: false
    },
    tipo: {
        type: Sequelize.ENUM("entrada", "saida", "ajuste", "devolucao", "perda"),
        allowNull: false,
        defaultValue: "entrada"
    },
    quantidade: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    stock_anterior: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    stock_posterior: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    preco_unitario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    valor_total: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    documento: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    motivo: {
        type: Sequelize.STRING(200),
        allowNull: true
    },
    data_movimento: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    requisicao_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    saida_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    usuario_criou: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    observacao: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = Movimentos;