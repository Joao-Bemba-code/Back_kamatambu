const { Sequelize, sequelize } = require("../config/index.js");

const Matriculas = sequelize.define("Matriculas", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Nome: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: "O nome é obrigatório" }
        }
    },
    Encarregado: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    Morada: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    BI_Cedula: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    Nascimento: {
        type: Sequelize.DATEONLY,
        allowNull: true
    },
    Estado_Civil: {
        type: Sequelize.ENUM("Solteiro", "Casado", "Divorciado", "Viúvo"),
        allowNull: false,
        defaultValue: "Solteiro"
    },
    Genero: {
        type: Sequelize.ENUM("Masculino", "Feminino"),
        allowNull: false,
        validate: {
            notEmpty: { msg: "O gênero é obrigatório" }
        }
    },
    Telefone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: { msg: "O telefone é obrigatório" }
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
    Turma: {
        type: Sequelize.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: "A turma é obrigatória" }
        }
    },
    Status: {
        type: Sequelize.ENUM("Inscrito", "Admitido", "Desistente", "Concluido", "Ativo"),
        defaultValue: "Inscrito",
        allowNull: false
    },
    Foto_User: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    Foto_Certificado: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    Data_Matricula: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
}, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = Matriculas;