const express = require("express");
const { Sequelize, sequelize } = require("../config/index.js");
const router_estoque = express.Router();
const { Produtos, Movimentos, Requisicoes, RequisicaoItens, Saidas } = require("../models/index.js");
const { requireAdmin, requireAdminOrTesouraria } = require("../protect/index.js");

const hoje = () => new Date().toISOString().split("T")[0];

function filtroData(where, campo, de, ate) {
    if (de) where[campo] = Object.assign(where[campo] || {}, { [Sequelize.Op.gte]: de });
    if (ate) where[campo] = Object.assign(where[campo] || {}, { [Sequelize.Op.lte]: ate });
}

// Regista um movimento e actualiza o stock do produto dentro de uma transacao
async function registarMovimento(dados, transaction) {
    var produto = await Produtos.findByPk(dados.produto_id, {
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : undefined
    });

    if (!produto) {
        var erro = new Error("Produto nÃ£o encontrado");
        erro.status = 404;
        throw erro;
    }

    var quantidade = parseInt(dados.quantidade);
    var anterior = produto.stock_atual;
    var posterior = anterior;

    if (dados.tipo === "ajuste") {
        posterior = quantidade;
    } else if (dados.tipo === "entrada" || dados.tipo === "devolucao") {
        posterior = anterior + quantidade;
    } else {
        if (quantidade > anterior) {
            var erro = new Error(`Stock insuficiente de "${produto.nome}". DisponÃ­vel: ${anterior} ${produto.unidade}`);
            erro.status = 400;
            throw erro;
        }
        posterior = anterior - quantidade;
    }

    if (posterior < 0) {
        var erroNeg = new Error("O stock nÃ£o pode ficar negativo");
        erroNeg.status = 400;
        throw erroNeg;
    }

    var preco = dados.preco_unitario !== undefined && dados.preco_unitario !== null && dados.preco_unitario !== ""
        ? parseFloat(dados.preco_unitario)
        : parseFloat(produto.preco_custo);

    if (isNaN(preco) || preco < 0) preco = 0;

    var movimento = await Movimentos.create({
        produto_id: produto.id,
        produto_nome: produto.nome,
        tipo: dados.tipo || "entrada",
        quantidade: quantidade,
        stock_anterior: anterior,
        stock_posterior: posterior,
        preco_unitario: preco,
        valor_total: (posterior - anterior) * preco,
        documento: dados.documento || null,
        motivo: dados.motivo || null,
        data_movimento: dados.data_movimento || hoje(),
        requisicao_id: dados.requisicao_id || null,
        saida_id: dados.saida_id || null,
        usuario_criou: dados.usuario_criou || null,
        observacao: dados.observacao || null
    }, { transaction });

    await produto.update({ stock_atual: posterior }, { transaction });

    return movimento;
}

function responderErro(res, error, contexto) {
    console.error(contexto, error);
    return res.status(error.status || 500).json({
        success: false,
        message: error.status ? error.message : "Erro interno do servidor"
    });
}

// ================= RESUMO =================
router_estoque.get("/resumo", async (req, res) => {
    try {
        var { de, ate } = req.query;
        var whereMov = {};
        filtroData(whereMov, "data_movimento", de, ate);

        var whereReq = {};
        filtroData(whereReq, "data_requisicao", de, ate);

        var [itens, pendentes, entradas, saidasPeriodo, aprovadasPeriodo] = await Promise.all([
            Produtos.count({ where: { ativo: true } }),
            Requisicoes.count({ where: { estado: "pendente" } }),
            Movimentos.sum("valor_total", { where: Object.assign({ tipo: "entrada" }, whereMov) }),
            Movimentos.sum("valor_total", { where: Object.assign({ tipo: "saida" }, whereMov) }),
            Requisicoes.count({ where: Object.assign({ estado: "aprovada" }, whereReq) })
        ]);

        var produtos = await Produtos.findAll({ where: { ativo: true } });
        var baixo = produtos.filter(function (p) {
            return parseInt(p.stock_minimo) > 0 && parseInt(p.stock_atual) <= parseInt(p.stock_minimo);
        });

        var valorStock = produtos.reduce(function (acc, p) {
            return acc + parseInt(p.stock_atual) * parseFloat(p.preco_custo);
        }, 0);

        return res.status(200).json({
            success: true,
            data: {
                total_itens: itens,
                abaixo_minimo: baixo.length,
                requisicoes_pendentes: pendentes,
                requisicoes_aprovadas: aprovadasPeriodo,
                valor_stock: valorStock,
                total_entradas: parseFloat(entradas || 0),
                total_saidas: Math.abs(parseFloat(saidasPeriodo || 0)),
                produtos_abaixo_minimo: baixo.map(function (p) {
                    return {
                        id: p.id,
                        nome: p.nome,
                        unidade: p.unidade,
                        stock_atual: p.stock_atual,
                        stock_minimo: p.stock_minimo
                    };
                })
            }
        });
    } catch (error) {
        return responderErro(res, error, "Erro ao carregar resumo do estoque:");
    }
});

// ================= PRODUTOS =================
router_estoque.get("/produtos", async (req, res) => {
    try {
        var { busca, categoria, incluir_inactivos } = req.query;
        var where = {};

        if (incluir_inactivos !== "true") where.ativo = true;
        if (categoria) where.categoria = categoria;
        if (busca) {
            var termo = `%${busca.toLowerCase()}%`;
            where[Sequelize.Op.or] = [
                Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("nome")), { [Sequelize.Op.like]: termo }),
                Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("codigo")), { [Sequelize.Op.like]: termo })
            ];
        }

        var produtos = await Produtos.findAll({ where: where, order: [['nome', 'ASC']] });

        var lista = produtos.map(function (p) {
            return Object.assign({}, p.toJSON(), {
                valor_total: parseInt(p.stock_atual) * parseFloat(p.preco_custo),
                abaixo_minimo: parseInt(p.stock_minimo) > 0 && parseInt(p.stock_atual) <= parseInt(p.stock_minimo)
            });
        });

        return res.status(200).json({ success: true, count: lista.length, data: lista });
    } catch (error) {
        return responderErro(res, error, "Erro ao listar produtos:");
    }
});

router_estoque.get("/produtos/:id", async (req, res) => {
    try {
        var produto = await Produtos.findByPk(req.params.id);

        if (!produto) {
            return res.status(404).json({ success: false, message: "Produto nÃ£o encontrado" });
        }

        var movimentos = await Movimentos.findAll({
            where: { produto_id: produto.id },
            order: [['data_movimento', 'DESC'], ['id', 'DESC']],
            limit: 50
        });

        return res.status(200).json({ success: true, data: Object.assign(produto.toJSON(), { movimentos: movimentos }) });
    } catch (error) {
        return responderErro(res, error, "Erro ao carregar produto:");
    }
});

router_estoque.get("/categorias", async (req, res) => {
    try {
        var lista = await Produtos.findAll({
            attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("categoria")), "categoria"]],
            order: [[Sequelize.col("categoria"), "ASC"]]
        });

        var categorias = lista
            .map(function (c) { return c.categoria; })
            .filter(function (c) { return !!c; });

        return res.status(200).json({ success: true, data: categorias });
    } catch (error) {
        return responderErro(res, error, "Erro ao listar categorias:");
    }
});

router_estoque.post("/produtos", requireAdminOrTesouraria, async (req, res) => {
    try {
        var { nome, codigo, categoria, unidade, preco_custo, stock_atual, stock_minimo, localizacao, observacao } = req.body;

        if (!nome || !nome.trim()) {
            return res.status(400).json({ success: false, message: "O nome do produto Ã© obrigatÃ³rio" });
        }

        if (codigo) {
            var existe = await Produtos.findOne({ where: { codigo: codigo.trim() } });
            if (existe) {
                return res.status(400).json({ success: false, message: "JÃ¡ existe um produto com este cÃ³digo" });
            }
        }

        var novo = await Produtos.create({
            nome: nome.trim(),
            codigo: codigo ? codigo.trim() : null,
            categoria: categoria || "Geral",
            unidade: unidade || "un",
            preco_custo: preco_custo ? parseFloat(preco_custo) : 0,
            stock_atual: stock_atual ? parseInt(stock_atual) : 0,
            stock_minimo: stock_minimo ? parseInt(stock_minimo) : 0,
            localizacao: localizacao || null,
            observacao: observacao || null,
            usuario_criou: req.user.nome
        });

        return res.status(201).json({ success: true, message: "Produto criado com sucesso", data: novo });
    } catch (error) {
        return responderErro(res, error, "Erro ao criar produto:");
    }
});

router_estoque.put("/produtos/:id", requireAdminOrTesouraria, async (req, res) => {
    try {
        var produto = await Produtos.findByPk(req.params.id);

        if (!produto) {
            return res.status(404).json({ success: false, message: "Produto nÃ£o encontrado" });
        }

        var { nome, codigo, categoria, unidade, preco_custo, stock_minimo, localizacao, ativo, observacao } = req.body;

        await produto.update({
            nome: nome ? nome.trim() : produto.nome,
            codigo: codigo !== undefined ? codigo : produto.codigo,
            categoria: categoria || produto.categoria,
            unidade: unidade || produto.unidade,
            preco_custo: preco_custo !== undefined && preco_custo !== "" ? parseFloat(preco_custo) : produto.preco_custo,
            stock_minimo: stock_minimo !== undefined && stock_minimo !== "" ? parseInt(stock_minimo) : produto.stock_minimo,
            localizacao: localizacao !== undefined ? localizacao : produto.localizacao,
            ativo: ativo !== undefined ? !!ativo : produto.ativo,
            observacao: observacao !== undefined ? observacao : produto.observacao
        });

        return res.status(200).json({ success: true, message: "Produto atualizado com sucesso", data: produto });
    } catch (error) {
        return responderErro(res, error, "Erro ao actualizar produto:");
    }
});

router_estoque.delete("/produtos/:id", requireAdminOrTesouraria, async (req, res) => {
    try {
        var produto = await Produtos.findByPk(req.params.id);

        if (!produto) {
            return res.status(404).json({ success: false, message: "Produto nÃ£o encontrado" });
        }

        var movimentos = await Movimentos.count({ where: { produto_id: produto.id } });

        if (movimentos > 0) {
            await produto.update({ ativo: false });
            await Movimentos.update({ ativo: false }, { where: { produto_id: produto.id, ativo: true } });
            return res.status(200).json({
                success: true,
                message: "Produto desactivado (possui movimentos registados)"
            });
        }

        await produto.destroy();

        return res.status(200).json({ success: true, message: "Produto eliminado com sucesso" });
    } catch (error) {
        return responderErro(res, error, "Erro ao eliminar produto:");
    }
});

// ================= MOVIMENTOS =================
router_estoque.get("/movimentos", async (req, res) => {
    try {
        var { produto_id, tipo, de, ate, limite, incluir_inactivos } = req.query;
        var where = {};

        if (incluir_inactivos !== "true") where.ativo = true;
        if (produto_id) where.produto_id = produto_id;
        if (tipo) where.tipo = tipo;
        filtroData(where, "data_movimento", de, ate);

        var lista = await Movimentos.findAll({
            where: where,
            order: [['data_movimento', 'DESC'], ['id', 'DESC']],
            limit: limite ? parseInt(limite) : 500
        });

        var totalEntradas = lista.filter(function (m) { return m.tipo === "entrada" || m.tipo === "devolucao"; })
            .reduce(function (a, m) { return a + parseFloat(m.valor_total); }, 0);
        var totalSaidas = lista.filter(function (m) { return m.tipo === "saida" || m.tipo === "perda"; })
            .reduce(function (a, m) { return a + Math.abs(parseFloat(m.valor_total)); }, 0);

        return res.status(200).json({
            success: true,
            count: lista.length,
            resumo: { total_entradas: totalEntradas, total_saidas: totalSaidas },
            data: lista
        });
    } catch (error) {
        return responderErro(res, error, "Erro ao listar movimentos:");
    }
});

router_estoque.post("/movimentos", requireAdminOrTesouraria, async (req, res) => {
    var transaction = null;
    try {
        var { produto_id, tipo, quantidade, preco_unitario, documento, motivo, data_movimento, observacao } = req.body;

        if (!produto_id) {
            return res.status(400).json({ success: false, message: "Escolha o produto" });
        }
        if (!tipo || ["entrada", "saida", "ajuste", "devolucao", "perda"].indexOf(tipo) === -1) {
            return res.status(400).json({ success: false, message: "Tipo de movimento invÃ¡lido" });
        }
        if (!quantidade || parseInt(quantidade) <= 0) {
            return res.status(400).json({ success: false, message: "A quantidade deve ser maior que zero" });
        }

        transaction = await sequelize.transaction();

        var movimento = await registarMovimento({
            produto_id: parseInt(produto_id),
            tipo: tipo,
            quantidade: parseInt(quantidade),
            preco_unitario: preco_unitario,
            documento: documento,
            motivo: motivo,
            data_movimento: data_movimento,
            observacao: observacao,
            usuario_criou: req.user.nome
        }, transaction);

        await transaction.commit();

        return res.status(201).json({ success: true, message: "Movimento registado com sucesso", data: movimento });
    } catch (error) {
        if (transaction) await transaction.rollback();
        return responderErro(res, error, "Erro ao registar movimento:");
    }
});

// Entrada de varios produtos de uma vez (compra/recebimento)
router_estoque.post("/movimentos/lote", requireAdminOrTesouraria, async (req, res) => {
    var transaction = null;
    try {
        var { itens, documento, data_movimento, observacao } = req.body;

        if (!Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ success: false, message: "Envie pelo menos um produto" });
        }

        transaction = await sequelize.transaction();

        var movimentos = [];
        for (var i = 0; i < itens.length; i++) {
            var item = itens[i];
            if (!item.produto_id || !item.quantidade || parseInt(item.quantidade) <= 0) continue;

            movimentos.push(await registarMovimento({
                produto_id: parseInt(item.produto_id),
                tipo: item.tipo || "entrada",
                quantidade: parseInt(item.quantidade),
                preco_unitario: item.preco_unitario,
                documento: documento,
                motivo: item.motivo || "Recebimento",
                data_movimento: data_movimento,
                observacao: observacao,
                usuario_criou: req.user.nome
            }, transaction));
        }

        if (movimentos.length === 0) {
            await transaction.rollback();
            transaction = null;
            return res.status(400).json({ success: false, message: "Nenhum item vÃ¡lido no lote" });
        }

        await transaction.commit();
        transaction = null;

        return res.status(201).json({
            success: true,
            message: `${movimentos.length} movimento(s) registado(s)`,
            data: movimentos
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        return responderErro(res, error, "Erro ao registar lote de movimentos:");
    }
});

// ================= REQUISIÃ‡Ã•ES =================
router_estoque.get("/requisicoes", async (req, res) => {
    try {
        var { estado, de, ate } = req.query;
        var where = {};

        if (estado) where.estado = estado;
        filtroData(where, "data_requisicao", de, ate);

        var requisicoes = await Requisicoes.findAll({
            where: where,
            order: [['data_requisicao', 'DESC'], ['id', 'DESC']],
            include: [{
                model: RequisicaoItens,
                as: "itens",
                required: false
            }]
        });

        var lista = requisicoes.map(function (r) {
            var itens = r.itens || [];
            return Object.assign({}, r.toJSON(), {
                itens: itens,
                total_itens: itens.reduce(function (a, i) { return a + parseInt(i.quantidade); }, 0)
            });
        });

        return res.status(200).json({ success: true, count: lista.length, data: lista });
    } catch (error) {
        return responderErro(res, error, "Erro ao listar requisiÃ§Ãµes:");
    }
});

router_estoque.get("/requisicoes/:id", async (req, res) => {
    try {
        var requisicao = await Requisicoes.findByPk(req.params.id);

        if (!requisicao) {
            return res.status(404).json({ success: false, message: "RequisiÃ§Ã£o nÃ£o encontrada" });
        }

        var itens = await RequisicaoItens.findAll({ where: { requisicao_id: requisicao.id } });

        return res.status(200).json({ success: true, data: Object.assign(requisicao.toJSON(), { itens: itens }) });
    } catch (error) {
        return responderErro(res, error, "Erro ao carregar requisiÃ§Ã£o:");
    }
});

router_estoque.post("/requisicoes", async (req, res) => {
    var transaction = null;
    try {
        var { itens, tipo, setor, turma, observacao, solicitante } = req.body;

        if (!Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ success: false, message: "Adicione pelo menos um produto Ã  requisiÃ§Ã£o" });
        }

        transaction = await sequelize.transaction();

        var total = 0;
        var linhas = [];

        for (var i = 0; i < itens.length; i++) {
            var item = itens[i];
            if (!item.produto_id || !item.quantidade || parseInt(item.quantidade) <= 0) continue;

            var produto = await Produtos.findByPk(parseInt(item.produto_id), { transaction });
            if (!produto) {
                var erroProd = new Error("Produto nÃ£o encontrado na requisiÃ§Ã£o");
                erroProd.status = 400;
                throw erroProd;
            }
            if (!produto.ativo) {
                var erroAtivo = new Error(`O produto "${produto.nome}" estÃ¡ desactivado`);
                erroAtivo.status = 400;
                throw erroAtivo;
            }
            if (parseInt(item.quantidade) > produto.stock_atual) {
                var erroStock = new Error(`Stock insuficiente de "${produto.nome}". DisponÃ­vel: ${produto.stock_atual} ${produto.unidade}`);
                erroStock.status = 400;
                throw erroStock;
            }

            var preco = item.preco_unitario !== undefined && item.preco_unitario !== "" ? parseFloat(item.preco_unitario) : parseFloat(produto.preco_custo);
            var subtotal = parseInt(item.quantidade) * preco;
            total += subtotal;

            linhas.push({
                produto_id: produto.id,
                produto_nome: produto.nome,
                quantidade: parseInt(item.quantidade),
                preco_unitario: preco,
                subtotal: subtotal,
                observacao: item.observacao || null
            });
        }

        if (linhas.length === 0) {
            await transaction.rollback();
            transaction = null;
            return res.status(400).json({ success: false, message: "Nenhum item vÃ¡lido na requisiÃ§Ã£o" });
        }

        var requisicao = await Requisicoes.create({
            numero: "REQ-TMP",
            solicitante: solicitante ? solicitante.trim() : req.user.nome,
            solicitante_id: req.user.id,
            setor: setor || null,
            turma: turma || null,
            tipo: tipo || "material",
            estado: "pendente",
            data_requisicao: hoje(),
            total_estimado: total,
            observacao: observacao || null
        }, { transaction });

        await requisicao.update({
            numero: `REQ-${new Date().getFullYear()}-${String(requisicao.id).padStart(4, "0")}`
        }, { transaction });

        await RequisicaoItens.bulkCreate(linhas.map(function (l) {
            return Object.assign({ requisicao_id: requisicao.id }, l);
        }), { transaction });

        await transaction.commit();
        transaction = null;

        return res.status(201).json({
            success: true,
            message: "RequisiÃ§Ã£o submetida com sucesso",
            data: Object.assign(requisicao.toJSON(), { itens: linhas })
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        return responderErro(res, error, "Erro ao criar requisiÃ§Ã£o:");
    }
});

router_estoque.put("/requisicoes/:id/aprovar", requireAdminOrTesouraria, async (req, res) => {
    var transaction = null;
    try {
        var requisicao = await Requisicoes.findByPk(req.params.id);

        if (!requisicao) {
            return res.status(404).json({ success: false, message: "RequisiÃ§Ã£o nÃ£o encontrada" });
        }

        if (requisicao.estado !== "pendente") {
            return res.status(400).json({ success: false, message: `RequisiÃ§Ã£o jÃ¡ estÃ¡ ${requisicao.estado}` });
        }

        var itens = await RequisicaoItens.findAll({ where: { requisicao_id: requisicao.id } });

        transaction = await sequelize.transaction();

        var saida = null;
        if (!requisicao.saida_id) {
            saida = await Saidas.create({
                descricao: `Material requisitado - ${requisicao.numero}`,
                tipo: "material",
                valor: parseFloat(requisicao.total_estimado),
                data_saida: hoje(),
                status: "pago",
                forma_pagamento: "dinheiro",
                observacao: `RequisiÃ§Ã£o de ${requisicao.solicitante}${requisicao.setor ? " (" + requisicao.setor + ")" : ""}`,
                usuario_criou: req.user.nome
            }, { transaction });
        }

        for (var i = 0; i < itens.length; i++) {
            await registarMovimento({
                produto_id: itens[i].produto_id,
                tipo: "saida",
                quantidade: itens[i].quantidade,
                preco_unitario: itens[i].preco_unitario,
                motivo: `RequisiÃ§Ã£o ${requisicao.numero}`,
                documento: requisicao.numero,
                data_movimento: hoje(),
                requisicao_id: requisicao.id,
                saida_id: saida ? saida.id : requisicao.saida_id,
                observacao: requisicao.solicitante,
                usuario_criou: req.user.nome
            }, transaction);
        }

        await requisicao.update({
            estado: "aprovada",
            data_decisao: hoje(),
            decidido_por: req.user.nome,
            motivo_decisao: req.body.motivo_decisao || null,
            saida_id: saida ? saida.id : requisicao.saida_id
        }, { transaction });

        await transaction.commit();
        transaction = null;

        return res.status(200).json({
            success: true,
            message: `RequisiÃ§Ã£o ${requisicao.numero} aprovada. Stock actualizado.`,
            data: requisicao
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        return responderErro(res, error, "Erro ao aprovar requisiÃ§Ã£o:");
    }
});

router_estoque.put("/requisicoes/:id/rejeitar", requireAdminOrTesouraria, async (req, res) => {
    try {
        var requisicao = await Requisicoes.findByPk(req.params.id);

        if (!requisicao) {
            return res.status(404).json({ success: false, message: "RequisiÃ§Ã£o nÃ£o encontrada" });
        }

        if (requisicao.estado !== "pendente") {
            return res.status(400).json({ success: false, message: `RequisiÃ§Ã£o jÃ¡ estÃ¡ ${requisicao.estado}` });
        }

        await requisicao.update({
            estado: "rejeitada",
            data_decisao: hoje(),
            decidido_por: req.user.nome,
            motivo_decisao: req.body.motivo_decisao || null
        });

        return res.status(200).json({ success: true, message: "RequisiÃ§Ã£o rejeitada", data: requisicao });
    } catch (error) {
        return responderErro(res, error, "Erro ao rejeitar requisiÃ§Ã£o:");
    }
});

router_estoque.put("/requisicoes/:id/cancelar", async (req, res) => {
    try {
        var requisicao = await Requisicoes.findByPk(req.params.id);

        if (!requisicao) {
            return res.status(404).json({ success: false, message: "RequisiÃ§Ã£o nÃ£o encontrada" });
        }

        if (requisicao.estado !== "pendente") {
            return res.status(400).json({ success: false, message: "SÃ³ Ã© possÃ­vel cancelar requisiÃ§Ãµes pendentes" });
        }

        await requisicao.update({ estado: "cancelada", data_decisao: hoje(), decidido_por: req.user.nome });

        return res.status(200).json({ success: true, message: "RequisiÃ§Ã£o cancelada", data: requisicao });
    } catch (error) {
        return responderErro(res, error, "Erro ao cancelar requisiÃ§Ã£o:");
    }
});

module.exports = router_estoque;