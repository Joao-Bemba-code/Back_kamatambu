const { Sequelize, sequelize } = require("../config/index.js");

const Requisicoes = sequelize.define("Requisicoes", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    numero: {
        type: Sequelize.STRING(30),
        allowNull: false
    },
    solicitante: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: "O solicitante é obrigatório" }
        }
    },
    solicitante_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    setor: {
        type: Sequelize.STRING(80),
        allowNull: true
    },
    turma: {
        type: Sequelize.STRING(50),
        allowNull: true
    },
    tipo: {
        type: Sequelize.ENUM("material", "limpeza", "equipamento", "manutencao", "outro"),
        allowNull: false,
        defaultValue: "material"
    },
    estado: {
        type: Sequelize.ENUM("pendente", "aprovada", "rejeitada", "cancelada"),
        allowNull: false,
        defaultValue: "pendente"
    },
    data_requisicao: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    data_decisao: {
        type: Sequelize.DATEONLY,
        allowNull: true
    },
    decidido_por: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    motivo_decisao: {
        type: Sequelize.STRING(200),
        allowNull: true
    },
    total_estimado: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    saida_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    observacao: {
        type: Sequelize.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = Requisicoes;