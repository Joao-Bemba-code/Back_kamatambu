var dotenv = require('dotenv');
dotenv.config({path:'../.env'});

var {Name_database, User_database, Pass_database, Host_database, Lang_database, Port, CA_path} = process.env;

var Sequelize = require('sequelize');

var sequelize = new Sequelize(Name_database, User_database, Pass_database, {
    host: Host_database,
    dialect: Lang_database,
    port: Port ? parseInt(Port) : 4000,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
            ...(CA_path && CA_path !== '<CA_PATH>' ? { ca: CA_path } : {})
        }
    },
    connectTimeout: 60000,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

sequelize.authenticate()
    .then(() => {
        console.log(" Conectado com sucesso ao banco!");
    })
    .catch((e) => {
        console.log(" Houve um erro ao conectar:", e.message);
        console.log("Detalhes:", e);
    });

module.exports = {
    Sequelize,
    sequelize
};