const express = require("express");
const router_saidas = express.Router();
const { Saidas } = require("../models/index.js");

router_saidas.get("/", async (req, res) => {
    try {
        var saidas = await Saidas.findAll({
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            count: saidas.length,
            data: saidas
        });
    } catch (error) {
        console.error("Erro ao listar saídas:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_saidas.post("/", async (req, res) => {
    try {
        var { 
            descricao, 
            tipo, 
            valor, 
            data_saida, 
            status, 
            forma_pagamento, 
            observacao
        } = req.body;

        if (!descricao) {
            return res.status(400).json({
                success: false,
                message: "A descrição é obrigatória"
            });
        }

        if (!valor || parseFloat(valor) <= 0) {
            return res.status(400).json({
                success: false,
                message: "O valor deve ser maior que zero"
            });
        }

        var newSaida = await Saidas.create({
            descricao: descricao.trim(),
            tipo: tipo || 'outro',
            valor: parseFloat(valor),
            data_saida: data_saida || new Date().toISOString().split('T')[0],
            status: status || 'pago',
            forma_pagamento: forma_pagamento || 'dinheiro',
            observacao: observacao || null,
            usuario_criou: 'admin'
        });

        return res.status(201).json({
            success: true,
            message: "Saída registrada com sucesso",
            data: newSaida
        });

    } catch (error) {
        console.error("Erro ao criar saída:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_saidas.put("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var { 
            descricao, 
            tipo, 
            valor, 
            data_saida, 
            status, 
            forma_pagamento, 
            observacao
        } = req.body;

        var saida = await Saidas.findByPk(id);

        if (!saida) {
            return res.status(404).json({
                success: false,
                message: "Saída não encontrada"
            });
        }

        await saida.update({
            descricao: descricao ? descricao.trim() : saida.descricao,
            tipo: tipo || saida.tipo,
            valor: valor ? parseFloat(valor) : saida.valor,
            data_saida: data_saida || saida.data_saida,
            status: status || saida.status,
            forma_pagamento: forma_pagamento || saida.forma_pagamento,
            observacao: observacao || saida.observacao
        });

        return res.status(200).json({
            success: true,
            message: "Saída atualizada com sucesso",
            data: saida
        });

    } catch (error) {
        console.error("Erro ao atualizar saída:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_saidas.delete("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var saida = await Saidas.findByPk(id);

        if (!saida) {
            return res.status(404).json({
                success: false,
                message: "Saída não encontrada"
            });
        }

        await saida.destroy();

        return res.status(200).json({
            success: true,
            message: "Saída deletada com sucesso"
        });

    } catch (error) {
        console.error("Erro ao deletar saída:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

module.exports = router_saidas;
