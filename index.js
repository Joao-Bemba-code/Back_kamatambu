var express = require('express');

var dotenv = require('dotenv');

dotenv.config();

var app = express();

var port =  process.env.port || 3000;

app.listen(port, (e)=>{
    if(e){
        console.log('houve um erro ao executar server');
    }
    console.log("server on!");
});

