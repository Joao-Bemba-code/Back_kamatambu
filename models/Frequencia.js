// models/Frequencia.js
const { Sequelize, sequelize } = require("../config/index.js");

const Frequencia = sequelize.define("Frequencia", {
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
    disciplina: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    modulo: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    data_aula: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    presente: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    horas_aula: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 2
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

module.exports = Frequencia;