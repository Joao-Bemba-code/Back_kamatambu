const { Sequelize, sequelize } = require("../config/index.js");

const Formadores = sequelize.define("Formadores", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Nome: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    Email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
    },
    Telefone: {
        type: Sequelize.STRING(20),
        allowNull: false
    },
    Especialidade: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    Curso: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    Turmas: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    Status: {
        type: Sequelize.ENUM('Ativo', 'Inativo', 'Férias', 'Afastado'),
        defaultValue: 'Ativo',
        allowNull: false
    },
    Genero: {
        type: Sequelize.ENUM('Masculino', 'Feminino', 'Outro'),
        allowNull: false
    },
    Data_Nascimento: {
        type: Sequelize.DATEONLY,
        allowNull: true
    },
    BI: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true
    },
    Morada: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    Foto: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    Descricao: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    Data_Contratacao: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: Sequelize.NOW
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
})

module.exports = Formadores;