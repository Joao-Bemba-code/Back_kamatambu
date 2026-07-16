const express = require("express");
const router_criterios = express.Router();
const { CriteriosAvaliacao } = require("../models/index.js");

// Listar todos os critérios
router_criterios.get("/", async (req, res) => {
    try {
        const criterios = await CriteriosAvaliacao.findAll({
            order: [['id', 'ASC']]
        });
        return res.status(200).json({
            success: true,
            count: criterios.length,
            data: criterios
        });
    } catch (error) {
        console.error("Erro ao listar critérios:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// Buscar critério por ID
router_criterios.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const criterio = await CriteriosAvaliacao.findByPk(id);
        if (!criterio) {
            return res.status(404).json({
                success: false,
                message: "Critério não encontrado"
            });
        }
        return res.status(200).json({ success: true, data: criterio });
    } catch (error) {
        console.error("Erro ao buscar critério:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// Criar critério
router_criterios.post("/", async (req, res) => {
    try {
        const { nome, indicador, peso, instrumento } = req.body;

        if (!nome) {
            return res.status(400).json({
                success: false,
                message: "O nome do critério é obrigatório"
            });
        }
        if (!indicador) {
            return res.status(400).json({
                success: false,
                message: "O indicador é obrigatório"
            });
        }
        if (peso === undefined || peso === null) {
            return res.status(400).json({
                success: false,
                message: "O peso é obrigatório"
            });
        }
        if (!instrumento) {
            return res.status(400).json({
                success: false,
                message: "O instrumento de avaliação é obrigatório"
            });
        }

        const pesoNum = parseFloat(peso);
        if (isNaN(pesoNum) || pesoNum < 0 || pesoNum > 100) {
            return res.status(400).json({
                success: false,
                message: "O peso deve ser um valor entre 0 e 100"
            });
        }

        const novoCriterio = await CriteriosAvaliacao.create({
            nome: nome.trim(),
            indicador: indicador.trim(),
            peso: pesoNum,
            instrumento: instrumento.trim()
        });

        return res.status(201).json({
            success: true,
            message: "Critério criado com sucesso",
            data: novoCriterio
        });
    } catch (error) {
        console.error("Erro ao criar critério:", error);
        return res.status(500).json({
            success: false,
            message: "Erro: " + error.message
        });
    }
});

// Atualizar critério
router_criterios.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, indicador, peso, instrumento } = req.body;

        const criterio = await CriteriosAvaliacao.findByPk(id);
        if (!criterio) {
            return res.status(404).json({
                success: false,
                message: "Critério não encontrado"
            });
        }

        if (peso !== undefined) {
            const pesoNum = parseFloat(peso);
            if (isNaN(pesoNum) || pesoNum < 0 || pesoNum > 100) {
                return res.status(400).json({
                    success: false,
                    message: "O peso deve ser um valor entre 0 e 100"
                });
            }
        }

        await criterio.update({
            nome: nome ? nome.trim() : criterio.nome,
            indicador: indicador ? indicador.trim() : criterio.indicador,
            peso: peso !== undefined ? parseFloat(peso) : criterio.peso,
            instrumento: instrumento ? instrumento.trim() : criterio.instrumento
        });

        return res.status(200).json({
            success: true,
            message: "Critério atualizado com sucesso",
            data: criterio
        });
    } catch (error) {
        console.error("Erro ao atualizar critério:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// Eliminar critério
router_criterios.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const criterio = await CriteriosAvaliacao.findByPk(id);
        if (!criterio) {
            return res.status(404).json({
                success: false,
                message: "Critério não encontrado"
            });
        }
        await criterio.destroy();
        return res.status(200).json({
            success: true,
            message: "Critério eliminado com sucesso"
        });
    } catch (error) {
        console.error("Erro ao eliminar critério:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

module.exports = router_criterios;
