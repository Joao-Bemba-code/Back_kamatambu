const express = require("express");
const { Op } = require("sequelize");
const router_salas = express.Router();
const { Salas, Alugueres } = require("../models/index.js");

// ========== GET - Listar todas as salas ==========
router_salas.get("/", async (req, res) => {
    try {
        var salas = await Salas.findAll({
            order: [['createdAt', 'DESC']]
        });

        for (const sala of salas) {
            const ativos = await Alugueres.count({
                where: {
                    sala_id: sala.id,
                    Status: ['pago', 'pendente', 'parcial'],
                    Data_Fim: { [Op.gte]: new Date().toISOString().split('T')[0] }
                }
            });
            if (sala.Status === 'Disponível' && ativos > 0) {
                sala.Status = 'Ocupada';
                await sala.save();
            }
        }

        return res.status(200).json({
            success: true,
            count: salas.length,
            data: salas
        });
    } catch (error) {
        console.error("Erro ao listar salas:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== GET - Buscar sala por ID ==========
router_salas.get("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var sala = await Salas.findByPk(id);

        if (!sala) {
            return res.status(404).json({
                success: false,
                message: "Sala não encontrada"
            });
        }

        return res.status(200).json({
            success: true,
            data: sala
        });
    } catch (error) {
        console.error("Erro ao buscar sala:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== POST - Criar nova sala ==========
router_salas.post("/", async (req, res) => {
    try {
        var { Nome, Capacidade, Localizacao, Status, Preco_Hora, Preco_Dia } = req.body;

        if (!Nome) {
            return res.status(400).json({
                success: false,
                message: "O nome da sala é obrigatório"
            });
        }

        var newSala = await Salas.create({
            Nome: Nome.trim(),
            Capacidade: Capacidade || 20,
            Localizacao: Localizacao || null,
            Preco_Hora: Preco_Hora !== undefined && Preco_Hora !== '' ? parseFloat(Preco_Hora) : 0,
            Preco_Dia: Preco_Dia !== undefined && Preco_Dia !== '' ? parseFloat(Preco_Dia) : 0,
            Status: Status || 'Disponível'
        });

        return res.status(201).json({
            success: true,
            message: "Sala criada com sucesso",
            data: newSala
        });
    } catch (error) {
        console.error("Erro ao criar sala:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== PUT - Atualizar sala ==========
router_salas.put("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var { Nome, Capacidade, Localizacao, Status, Preco_Hora, Preco_Dia } = req.body;

        var sala = await Salas.findByPk(id);

        if (!sala) {
            return res.status(404).json({
                success: false,
                message: "Sala não encontrada"
            });
        }

        await sala.update({
            Nome: Nome ? Nome.trim() : sala.Nome,
            Capacidade: Capacidade || sala.Capacidade,
            Localizacao: Localizacao !== undefined ? Localizacao : sala.Localizacao,
            Preco_Hora: Preco_Hora !== undefined && Preco_Hora !== '' ? parseFloat(Preco_Hora) : sala.Preco_Hora,
            Preco_Dia: Preco_Dia !== undefined && Preco_Dia !== '' ? parseFloat(Preco_Dia) : sala.Preco_Dia,
            Status: Status || sala.Status
        });

        return res.status(200).json({
            success: true,
            message: "Sala atualizada com sucesso",
            data: sala
        });
    } catch (error) {
        console.error("Erro ao atualizar sala:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== DELETE - Deletar sala ==========
router_salas.delete("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var sala = await Salas.findByPk(id);

        if (!sala) {
            return res.status(404).json({
                success: false,
                message: "Sala não encontrada"
            });
        }

        await sala.destroy();

        return res.status(200).json({
            success: true,
            message: "Sala deletada com sucesso"
        });
    } catch (error) {
        console.error("Erro ao deletar sala:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

module.exports = router_salas;