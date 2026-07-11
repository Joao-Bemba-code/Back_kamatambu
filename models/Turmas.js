const { Sequelize, sequelize } = require("../config/index.js");

const Turmas = sequelize.define("Turmas", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Turma: {
        type: Sequelize.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: "O nome da turma é obrigatório" }
        }
    },
    Curso: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: "O curso é obrigatório" }
        }
    },
    Modulo: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    Periodo: {
        type: Sequelize.ENUM("Manhã", "Tarde", "Noite", "Integral"),
        allowNull: false,
        defaultValue: "Manhã"
    },
    Numero_Alunos: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    Capacidade_Maxima: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30,
        validate: {
            min: 1
        }
    },
    Data_INIC: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: "A data de início é obrigatória" }
        }
    },
    Data_Term: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: "A data de término é obrigatória" }
        }
    },
    Status: {
        type: Sequelize.ENUM("Ativa", "Concluída", "Cancelada", "Pendente"),
        defaultValue: "Pendente",
        allowNull: false
    },
    Formador: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    Sala: {
        type: Sequelize.STRING(20),
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = Turmas;