const { Sequelize, sequelize } = require("../config/index.js");

const Alugueres = sequelize.define("Alugueres", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sala_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    Sala: {
        type: Sequelize.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: "A sala é obrigatória" }
        }
    },
    Cliente: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: "O cliente é obrigatório" }
        }
    },
    Telefone: {
        type: Sequelize.STRING(30),
        allowNull: true
    },
    Data_Inicio: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: "A data de início é obrigatória" }
        }
    },
    Data_Fim: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: "A data de fim é obrigatória" }
        }
    },
    Valor: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    Tipo_Cobranca: {
        type: Sequelize.ENUM("hora", "dia"),
        defaultValue: "dia",
        allowNull: false
    },
    Duracao: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 0.01
        }
    },
    Status: {
        type: Sequelize.ENUM("pago", "pendente", "parcial", "cancelado"),
        defaultValue: "pendente",
        allowNull: false
    },
    Forma_Pagamento: {
        type: Sequelize.ENUM("dinheiro", "transferencia", "deposito", "multicaixa"),
        defaultValue: "dinheiro",
        allowNull: false
    },
    Observacao: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    Usuario_Criou: {
        type: Sequelize.STRING(100),
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = Alugueres;