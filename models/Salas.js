const { Sequelize, sequelize } = require("../config/index.js");

const Salas = sequelize.define("Salas", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Nome: {
        type: Sequelize.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: "O nome da sala é obrigatório" }
        }
    },
    Capacidade: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 20,
        validate: {
            min: 1
        }
    },
    Localizacao: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    Preco_Hora: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    Preco_Dia: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    Status: {
        type: Sequelize.ENUM("Disponível", "Ocupada", "Em manutenção", "Reservada"),
        defaultValue: "Disponível",
        allowNull: false
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = Salas;