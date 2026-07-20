var {Sequelize,sequelize} = require("../config/index.js");

var Users = sequelize.define("Users",{
    Nome:{
        type:Sequelize.STRING
    },
    Email:{
        type:Sequelize.STRING
    },
    Senha:{
        type:Sequelize.TEXT
    },
    eAdmin:{
        type:Sequelize.BOOLEAN
    },
    tipo:{
        type:Sequelize.ENUM('admin', 'pedagogico', 'tesouraria', 'recursos_humanos', 'pendente'),
        defaultValue: 'pendente'
    }
})

module.exports={
    Users
}