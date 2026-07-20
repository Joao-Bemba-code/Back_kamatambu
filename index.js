var express = require('express');
var dotenv = require('dotenv');
dotenv.config();

var cors = require("cors");
var path = require("path");
var { authenticate, requireAdmin } = require("./protect/index.js");

var router_auth = require("./routers/users.js");
var formadoresRoutes = require("./routers/formadores.js");
var matriculasRoutes = require("./routers/matriculas.js");
var turmasRoutes = require("./routers/turmas.js");
var cursosRoutes = require("./routers/cursos.js");
var pagamentosRoutes = require("./routers/pagamentos.js");
const statsRoutes = require("./routers/stats.js");
var academicoRoutes = require("./routers/academico.js");
var criteriosRoutes = require("./routers/criteriosAvaliacao.js");
var uploadRouter = require("./routers/upload.js");

var app = express();
var port = process.env.port || 8080;

app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Servir ficheiros de upload estaticamente
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// LOG
app.use((req, res, next) => {
    console.log(` ${req.method} ${req.url}`);
    next();
});

// Rotas publicas (auth)
app.use("/auth", router_auth);

// Rotas protegidas (token obrigatorio)
app.use("/api/formadores", authenticate, formadoresRoutes);
app.use("/api/matriculas", authenticate, matriculasRoutes);
app.use("/api/turmas", authenticate, turmasRoutes);
app.use("/api/cursos", authenticate, cursosRoutes);
app.use("/api/pagamentos", authenticate, pagamentosRoutes);
app.use("/api/stats", authenticate, statsRoutes);
app.use("/api/academico", authenticate, academicoRoutes);
app.use("/api/criterios-avaliacao", authenticate, criteriosRoutes);
app.use("/api/upload", authenticate, uploadRouter);

// Rotas publicas
app.get("/test", (req, res) => {
    console.log("Rota /test chamada!");
    res.status(200).json({ msg: "teste" });
});

app.get("/", (req, res) => {
    res.status(200).json({
        msg: "API está rodando!",
        port: port
    });
});

// 404
app.use((req, res) => {
    console.log(`Rota não encontrada: ${req.method} ${req.url}`);
    res.status(404).json({ error: "Rota não encontrada" });
});

app.listen(port, (e) => {
    if (e) {
        console.log('houve um erro ao executar server:', e);
    }
    console.log(`Server on na porta ${port}!`);
});
