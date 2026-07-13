const { Sequelize, sequelize } = require("../config/index.js");

const Cursos = sequelize.define("Cursos", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Nome: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: "O nome do curso é obrigatório" }
        }
    },
    Desc: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    Tipo_curso: {
        type: Sequelize.ENUM(
            "Formação profissional inicial", 
            "Formação profissional continua", 
            "Formação profissional de dupla Certificação"
        ),
        allowNull: false,
        defaultValue: "Formação profissional inicial"
    },
    Modulos: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    Edicao: {
        type: Sequelize.ENUM('1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º'),
        allowNull: false,
        defaultValue: '1º'
    },
    Duracao: {
        type: Sequelize.STRING(50),
        allowNull: true
    },
    Carga_Horaria: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
            min: 0
        }
    },
    Valor_curso: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    Status: {
        type: Sequelize.ENUM("Ativo", "Inativo", "Em desenvolvimento"),
        defaultValue: "Ativo",
        allowNull: false
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = Cursos;