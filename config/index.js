var dotenv = require('dotenv');

dotenv.config({path:'../.env'});

var {Name_database,User_database,Pass_database,Host_database,Lang_database} = process.env;

var Sequelize = require('sequelize');

var sequelize = new Sequelize(Name_database,User_database,Pass_database,{
    host:Host_database,
    dialect:Lang_database
});

sequelize.authenticate().then(()=>{
    console.log("conectado com successo");
}).catch((e)=>{
    console.log("houve um erro ao conectar",e);
})

module.exports={
    Sequelize,sequelize
};