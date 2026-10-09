const { Sequelize, sequelize } = require("../config/index.js");

const Produtos = sequelize.define("Produtos", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: Sequelize.STRING(150),
        allowNull: false,
        validate: {
            notEmpty: { msg: "O nome do produto é obrigatório" }
        }
    },
    codigo: {
        type: Sequelize.STRING(50),
        allowNull: true
    },
    categoria: {
        type: Sequelize.STRING(80),
        allowNull: true,
        defaultValue: "Geral"
    },
    unidade: {
        type: Sequelize.ENUM("un", "resma", "pacote", "caixa", "litro", "kg", "metro", "jogo"),
        allowNull: false,
        defaultValue: "un"
    },
    preco_custo: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    stock_atual: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    stock_minimo: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    localizacao: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

module.exports = Produtos;