var dotenv = require('dotenv');
dotenv.config();

var mysql = require('mysql2/promise');

async function createEstoqueTables() {
    var conn = await mysql.createConnection({
        host: process.env.Host_database,
        user: process.env.User_database,
        password: process.env.Pass_database,
        database: process.env.Name_database,
        port: parseInt(process.env.Port) || 4000,
        ssl: { rejectUnauthorized: false }
    });

    var tabelas = [
        [
            "Produtos",
            "CREATE TABLE IF NOT EXISTS `Produtos` (" +
            "`id` INTEGER NOT NULL AUTO_INCREMENT," +
            "`nome` VARCHAR(150) NOT NULL," +
            "`codigo` VARCHAR(50)," +
            "`categoria` VARCHAR(80) DEFAULT 'Geral'," +
            "`unidade` ENUM('un','resma','pacote','caixa','litro','kg','metro','jogo') NOT NULL DEFAULT 'un'," +
            "`preco_custo` DECIMAL(10,2) NOT NULL DEFAULT 0," +
            "`stock_atual` INTEGER NOT NULL DEFAULT 0," +
            "`stock_minimo` INTEGER NOT NULL DEFAULT 0," +
            "`localizacao` VARCHAR(100)," +
            "`ativo` TINYINT(1) NOT NULL DEFAULT 1," +
            "`observacao` TEXT," +
            "`usuario_criou` VARCHAR(100)," +
            "`createdAt` DATETIME NOT NULL," +
            "`updatedAt` DATETIME NOT NULL," +
            "PRIMARY KEY (`id`)," +
            "KEY idx_produtos_categoria (`categoria`)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        ],
        [
            "Movimentos",
            "CREATE TABLE IF NOT EXISTS `Movimentos` (" +
            "`id` INTEGER NOT NULL AUTO_INCREMENT," +
            "`produto_id` INTEGER NOT NULL," +
            "`produto_nome` VARCHAR(150) NOT NULL," +
            "`tipo` ENUM('entrada','saida','ajuste','devolucao','perda') NOT NULL DEFAULT 'entrada'," +
            "`quantidade` INTEGER NOT NULL," +
            "`stock_anterior` INTEGER NOT NULL DEFAULT 0," +
            "`stock_posterior` INTEGER NOT NULL DEFAULT 0," +
            "`preco_unitario` DECIMAL(10,2) NOT NULL DEFAULT 0," +
            "`valor_total` DECIMAL(12,2) NOT NULL DEFAULT 0," +
            "`documento` VARCHAR(100)," +
            "`motivo` VARCHAR(200)," +
            "`data_movimento` DATE NOT NULL," +
            "`requisicao_id` INTEGER," +
            "`saida_id` INTEGER," +
            "`usuario_criou` VARCHAR(100)," +
            "`observacao` TEXT," +
            "`createdAt` DATETIME NOT NULL," +
            "`updatedAt` DATETIME NOT NULL," +
            "PRIMARY KEY (`id`)," +
            "KEY idx_movimentos_produto (`produto_id`)," +
            "KEY idx_movimentos_data (`data_movimento`)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        ],
        [
            "Requisicoes",
            "CREATE TABLE IF NOT EXISTS `Requisicoes` (" +
            "`id` INTEGER NOT NULL AUTO_INCREMENT," +
            "`numero` VARCHAR(30) NOT NULL," +
            "`solicitante` VARCHAR(100) NOT NULL," +
            "`solicitante_id` INTEGER," +
            "`setor` VARCHAR(80)," +
            "`turma` VARCHAR(50)," +
            "`tipo` ENUM('material','limpeza','equipamento','manutencao','outro') NOT NULL DEFAULT 'material'," +
            "`estado` ENUM('pendente','aprovada','rejeitada','cancelada') NOT NULL DEFAULT 'pendente'," +
            "`data_requisicao` DATE NOT NULL," +
            "`data_decisao` DATE," +
            "`decidido_por` VARCHAR(100)," +
            "`motivo_decisao` VARCHAR(200)," +
            "`total_estimado` DECIMAL(12,2) NOT NULL DEFAULT 0," +
            "`saida_id` INTEGER," +
            "`observacao` TEXT," +
            "`createdAt` DATETIME NOT NULL," +
            "`updatedAt` DATETIME NOT NULL," +
            "PRIMARY KEY (`id`)," +
            "UNIQUE KEY idx_requisicoes_numero (`numero`)," +
            "KEY idx_requisicoes_estado (`estado`)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        ],
        [
            "RequisicaoItens",
            "CREATE TABLE IF NOT EXISTS `RequisicaoItens` (" +
            "`id` INTEGER NOT NULL AUTO_INCREMENT," +
            "`requisicao_id` INTEGER NOT NULL," +
            "`produto_id` INTEGER NOT NULL," +
            "`produto_nome` VARCHAR(150) NOT NULL," +
            "`quantidade` INTEGER NOT NULL," +
            "`preco_unitario` DECIMAL(10,2) NOT NULL DEFAULT 0," +
            "`subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0," +
            "`observacao` VARCHAR(200)," +
            "`createdAt` DATETIME NOT NULL," +
            "`updatedAt` DATETIME NOT NULL," +
            "PRIMARY KEY (`id`)," +
            "KEY idx_req_itens_requisicao (`requisicao_id`)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        ]
    ];

    try {
        for (var i = 0; i < tabelas.length; i++) {
            await conn.query(tabelas[i][1]);
            console.log("Tabela criada:", tabelas[i][0]);
        }
        console.log("Tabelas de estoque criadas com sucesso!");
    } catch (error) {
        console.error("Erro ao criar tabelas de estoque:", error.message);
    } finally {
        await conn.end();
    }
}

createEstoqueTables();