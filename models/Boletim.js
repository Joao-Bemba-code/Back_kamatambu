// models/Boletim.js
const { Sequelize, sequelize } = require("../config/index.js");

const Boletim = sequelize.define("Boletim", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    aluno_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'Matriculas',
            key: 'id'
        }
    },
    aluno: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    curso: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    turma: {
        type: Sequelize.STRING(50),
        allowNull: false
    },
    modulo: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    media_final: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
    },
    situacao: {
        type: Sequelize.ENUM('aprovado', 'reprovado', 'recuperacao', 'trancado'),
        allowNull: false,
        defaultValue: 'aprovado'
    },
    data_emissao: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    observacao: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    formador_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    formador: {
        type: Sequelize.STRING(100),
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = Boletim;