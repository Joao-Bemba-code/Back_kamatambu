// models/Pagamentos.js
const { Sequelize, sequelize } = require("../config/index.js");

const Pagamentos = sequelize.define("Pagamentos", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    aluno: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: "O nome do aluno é obrigatório" }
        }
    },
    aluno_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    curso: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: "O curso é obrigatório" }
        }
    },
    turma: {
        type: Sequelize.STRING(50),
        allowNull: true
    },
    tipo: {
        type: Sequelize.ENUM("matricula", "mensalidade", "certificado", "taxa", "outro"),
        allowNull: false,
        defaultValue: "mensalidade"
    },
    forma_pagamento: {
        type: Sequelize.ENUM("dinheiro", "transferencia", "deposito", "multicaixa"),
        allowNull: false,
        defaultValue: "dinheiro"
    },
    valor: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0,
            notEmpty: { msg: "O valor é obrigatório" }
        }
    },
    status: {
        type: Sequelize.ENUM("pago", "pendente", "parcial", "cancelado"),
        allowNull: false,
        defaultValue: "pendente"
    },
    data_pagamento: {
        type: Sequelize.DATEONLY,
        allowNull: true
    },
    data_vencimento: {
        type: Sequelize.DATEONLY,
        allowNull: true
    },
    observacao: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    comprovante: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    desconto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    multa: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    usuario_criou: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    usuario_atualizou: {
        type: Sequelize.STRING(100),
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = Pagamentos;