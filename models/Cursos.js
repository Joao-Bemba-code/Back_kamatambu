var {Sequelize,sequelize} = require("../config/index.js");

var Cursos = sequelize.define({

    Desc:{
        type:Sequelize.STRING
    },

    Tipo_curso:{
        type:Sequelize.STRING
    },
    Modulo:{
        type:Sequelize.TEXT
    },
    Edicao: {
       type: DataTypes.ENUM('1º', '2º', '3º', '4º', '5º'),
       allowNull: false,
       defaultValue: '1º'
    }
});

module.exports={Cursos};