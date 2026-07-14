// models/Notas.js
const { Sequelize, sequelize } = require("../config/index.js");

const Notas = sequelize.define("Notas", {
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
    tipo_avaliacao: {
        type: Sequelize.ENUM('prova', 'trabalho', 'projeto', 'exame', 'participacao', 'outro'),
        allowNull: false,
        defaultValue: 'prova'
    },
    nota: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        validate: {
            min: 0,
            max: 20
        }
    },
    peso: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 1.00
    },
    data_avaliacao: {
        type: Sequelize.DATEONLY,
        allowNull: true
    },
    observacao: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    formador_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
            model: 'Formadores',
            key: 'id'
        }
    },
    formador: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    status: {
        type: Sequelize.ENUM('aprovado', 'reprovado', 'recuperacao', 'pendente'),
        allowNull: false,
        defaultValue: 'pendente'
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = Notas;