var express = require('express');

var dotenv = require('dotenv');

dotenv.config();

var cors = require("cors");

var router_auth = require("./routers/users.js");

var formadoresRoutes = require("./routers/formadores.js");
var matriculasRoutes = require("./routers/matriculas.js");
var turmasRoutes = require("./routers/turmas.js");
var cursosRoutes = require("./routers/cursos.js");
const statsRoutes = require("./routers/stats.js");

var app = express();

var port =  process.env.port || 3000;

app.use(express.json());
app.use(cors());

// routers 

app.use("/auth",router_auth);
app.use("/api/formadores", formadoresRoutes);
app.use("/api/matriculas", matriculasRoutes);
app.use("/api/turmas", turmasRoutes);
app.use("/api/cursos", cursosRoutes);
app.use("/api/stats", statsRoutes);

// rota de test

app.get("/test",(req,res)=>{
    res.status(200).json({
        msg:"teste"
    })
});

app.listen(port, (e)=>{
    if(e){
        console.log('houve um erro ao executar server');
    }
    console.log("server on!");
});

