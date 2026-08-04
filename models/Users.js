var {Sequelize,sequelize} = require("../config/index.js");

var Users = sequelize.define("Users",{
    Nome:{
        type:Sequelize.STRING
    },
    Email:{
        type:Sequelize.STRING
    },
    Telefone:{
        type:Sequelize.STRING,
        allowNull: true
    },
    Senha:{
        type:Sequelize.TEXT
    },
    eAdmin:{
        type:Sequelize.BOOLEAN
    },
    formador_id:{
        type:Sequelize.INTEGER,
        allowNull: true
    },
    tipo:{
        type:Sequelize.ENUM('admin', 'pedagogico', 'tesouraria', 'recursos_humanos', 'pendente', 'formador'),
        defaultValue: 'pendente'
    }
})

module.exports={
    Users
}