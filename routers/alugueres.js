const express = require("express");
const router_alugueres = express.Router();
const { Alugueres, Salas } = require("../models/index.js");

// ========== GET - Listar todos os alugueres ==========
router_alugueres.get("/", async (req, res) => {
    try {
        var alugueres = await Alugueres.findAll({
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            count: alugueres.length,
            data: alugueres
        });
    } catch (error) {
        console.error("Erro ao listar alugueres:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== GET - Buscar aluguer por ID ==========
router_alugueres.get("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var aluguer = await Alugueres.findByPk(id);

        if (!aluguer) {
            return res.status(404).json({
                success: false,
                message: "Aluguer não encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            data: aluguer
        });
    } catch (error) {
        console.error("Erro ao buscar aluguer:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== POST - Criar novo aluguer ==========
router_alugueres.post("/", async (req, res) => {
    try {
        var {
            sala_id,
            Sala,
            Cliente,
            Telefone,
            Data_Inicio,
            Data_Fim,
            Valor,
            Status,
            Forma_Pagamento,
            Observacao
        } = req.body;

        if (!Sala) {
            return res.status(400).json({
                success: false,
                message: "A sala é obrigatória"
            });
        }

        if (!Cliente) {
            return res.status(400).json({
                success: false,
                message: "O cliente é obrigatório"
            });
        }

        if (!Valor || parseFloat(Valor) <= 0) {
            return res.status(400).json({
                success: false,
                message: "O valor deve ser maior que zero"
            });
        }

        if ((!Data_Inicio || !Data_Fim) || (Data_Fim < Data_Inicio)) {
            return res.status(400).json({
                success: false,
                message: "As datas de início e fim são obrigatórias (fim deve ser >= início)"
            });
        }

        if (sala_id) {
            var sala = await Salas.findByPk(sala_id);
            if (sala) {
                await sala.update({ Status: 'Ocupada' });
            }
        }

        var newAluguer = await Alugueres.create({
            sala_id: sala_id || null,
            Sala: Sala.trim(),
            Cliente: Cliente.trim(),
            Telefone: Telefone || null,
            Data_Inicio: Data_Inicio,
            Data_Fim: Data_Fim,
            Valor: parseFloat(Valor),
            Status: Status || 'pendente',
            Forma_Pagamento: Forma_Pagamento || 'dinheiro',
            Observacao: Observacao || null,
            Usuario_Criou: 'admin'
        });

        return res.status(201).json({
            success: true,
            message: "Aluguer registrado com sucesso",
            data: newAluguer
        });
    } catch (error) {
        console.error("Erro ao criar aluguer:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== PUT - Atualizar aluguer ==========
router_alugueres.put("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var {
            sala_id,
            Sala,
            Cliente,
            Telefone,
            Data_Inicio,
            Data_Fim,
            Valor,
            Status,
            Forma_Pagamento,
            Observacao
        } = req.body;

        var aluguer = await Alugueres.findByPk(id);

        if (!aluguer) {
            return res.status(404).json({
                success: false,
                message: "Aluguer não encontrado"
            });
        }

        if (Data_Inicio && Data_Fim && (Data_Fim < Data_Inicio)) {
            return res.status(400).json({
                success: false,
                message: "A data de fim deve ser maior ou igual à data de início"
            });
        }

        if (sala_id && sala_id !== aluguer.sala_id) {
            var sala = await Salas.findByPk(sala_id);
            if (sala) {
                await sala.update({ Status: 'Ocupada' });
            }
        }

        await aluguer.update({
            sala_id: sala_id !== undefined ? sala_id : aluguer.sala_id,
            Sala: Sala ? Sala.trim() : aluguer.Sala,
            Cliente: Cliente ? Cliente.trim() : aluguer.Cliente,
            Telefone: Telefone !== undefined ? Telefone : aluguer.Telefone,
            Data_Inicio: Data_Inicio || aluguer.Data_Inicio,
            Data_Fim: Data_Fim || aluguer.Data_Fim,
            Valor: Valor !== undefined ? parseFloat(Valor) : aluguer.Valor,
            Status: Status || aluguer.Status,
            Forma_Pagamento: Forma_Pagamento || aluguer.Forma_Pagamento,
            Observacao: Observacao !== undefined ? Observacao : aluguer.Observacao
        });

        return res.status(200).json({
            success: true,
            message: "Aluguer atualizado com sucesso",
            data: aluguer
        });
    } catch (error) {
        console.error("Erro ao atualizar aluguer:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== DELETE - Deletar aluguer ==========
router_alugueres.delete("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var aluguer = await Alugueres.findByPk(id);

        if (!aluguer) {
            return res.status(404).json({
                success: false,
                message: "Aluguer não encontrado"
            });
        }

        await aluguer.destroy();

        return res.status(200).json({
            success: true,
            message: "Aluguer deletado com sucesso"
        });
    } catch (error) {
        console.error("Erro ao deletar aluguer:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

module.exports = router_alugueres;