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
var port = process.env.port || 8080;

app.use(express.json());
app.use(cors());

// LOG - Mostrar todas as requisições
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.url}`);
    next();
});

// routers 
app.use("/auth", router_auth);
app.use("/api/formadores", formadoresRoutes);
app.use("/api/matriculas", matriculasRoutes);
app.use("/api/turmas", turmasRoutes);
app.use("/api/cursos", cursosRoutes);
app.use("/api/stats", statsRoutes);

// rota de test
app.get("/test", (req, res) => {
    console.log("Rota /test chamada!");
    res.status(200).json({
        msg: "teste"
    });
});

// Rota raiz
app.get("/", (req, res) => {
    res.status(200).json({
        msg: "API está rodando!",
        rotas: ["/test", "/auth", "/api/formadores", "/api/matriculas", "/api/turmas", "/api/cursos", "/api/stats"],
        port: port
    });
});

// Tratamento de rotas não encontradas (404)
app.use((req, res) => {
    console.log(`Rota não encontrada: ${req.method} ${req.url}`);
    res.status(404).json({
        error: "Rota não encontrada",
        url: req.url
    });
});

app.listen(port, (e) => {
    if (e) {
        console.log('houve um erro ao executar server:', e);
    }
    console.log(`Server on na porta ${port}!`);
    console.log(`Teste: http://localhost:${port}/test`);
    console.log(`Rotas: http://localhost:${port}/`);
});