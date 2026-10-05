const { Sequelize, sequelize } = require("../config/index.js");

const RequisicaoItens = sequelize.define("RequisicaoItens", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    requisicao_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    produto_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    produto_nome: {
        type: Sequelize.STRING(150),
        allowNull: false
    },
    quantidade: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    preco_unitario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    subtotal: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    observacao: {
        type: Sequelize.STRING(200),
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = RequisicaoItens;