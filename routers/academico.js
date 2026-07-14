// routers/academico.js (VERSÃO SIMPLIFICADA)
const express = require("express");
const router_academico = express.Router();
const { Notas, Matriculas } = require("../models/index.js");

// ========== NOTAS ==========

// Listar todas as notas
router_academico.get("/notas", async (req, res) => {
    try {
        const notas = await Notas.findAll({
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({
            success: true,
            count: notas.length,
            data: notas
        });
    } catch (error) {
        console.error("Erro ao listar notas:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// Listar notas por aluno
router_academico.get("/notas/aluno/:aluno_id", async (req, res) => {
    try {
        const { aluno_id } = req.params;
        const notas = await Notas.findAll({
            where: { aluno_id: parseInt(aluno_id) },
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({
            success: true,
            data: notas
        });
    } catch (error) {
        console.error("Erro ao buscar notas do aluno:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// Criar nota
router_academico.post("/notas", async (req, res) => {
    try {
        const { 
            aluno_id, aluno, curso, turma, disciplina, modulo,
            tipo_avaliacao, nota, peso, data_avaliacao,
            observacao, formador_id, formador
        } = req.body;

        console.log("Criando nota:", req.body);

        // Buscar o aluno se não veio o nome
        let alunoNome = aluno;
        let cursoNome = curso;
        let turmaNome = turma;
        
        if (aluno_id) {
            const matricula = await Matriculas.findByPk(parseInt(aluno_id));
            if (!matricula) {
                return res.status(404).json({
                    success: false,
                    message: "Aluno não encontrado"
                });
            }
            if (!alunoNome) alunoNome = matricula.Nome;
            if (!cursoNome) cursoNome = matricula.Curso;
            if (!turmaNome) turmaNome = matricula.Turma;
        }

        // Calcular status
        let status = 'pendente';
        const notaNum = parseFloat(nota);
        if (notaNum >= 10) status = 'aprovado';
        else if (notaNum >= 7) status = 'recuperacao';
        else if (notaNum < 7) status = 'reprovado';

        const newNota = await Notas.create({
            aluno_id: parseInt(aluno_id),
            aluno: alunoNome,
            curso: cursoNome,
            turma: turmaNome,
            disciplina: disciplina,
            modulo: modulo || 1,
            tipo_avaliacao: tipo_avaliacao || 'prova',
            nota: notaNum,
            peso: peso || 1.00,
            data_avaliacao: data_avaliacao || null,
            observacao: observacao || null,
            formador_id: formador_id || null,
            formador: formador || null,
            status: status
        });

        return res.status(201).json({
            success: true,
            message: "Nota registrada com sucesso",
            data: newNota
        });

    } catch (error) {
        console.error("Erro ao criar nota:", error);
        return res.status(500).json({
            success: false,
            message: "Erro: " + error.message
        });
    }
});

// Atualizar nota
router_academico.put("/notas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nota, tipo_avaliacao, observacao } = req.body;

        const notaExistente = await Notas.findByPk(id);
        if (!notaExistente) {
            return res.status(404).json({
                success: false,
                message: "Nota não encontrada"
            });
        }

        let novoStatus = notaExistente.status;
        if (nota !== undefined) {
            const notaNum = parseFloat(nota);
            if (notaNum >= 10) novoStatus = 'aprovado';
            else if (notaNum >= 7) novoStatus = 'recuperacao';
            else if (notaNum < 7) novoStatus = 'reprovado';
        }

        await notaExistente.update({
            nota: nota !== undefined ? parseFloat(nota) : notaExistente.nota,
            tipo_avaliacao: tipo_avaliacao || notaExistente.tipo_avaliacao,
            observacao: observacao || notaExistente.observacao,
            status: novoStatus
        });

        return res.status(200).json({
            success: true,
            message: "Nota atualizada com sucesso",
            data: notaExistente
        });

    } catch (error) {
        console.error("Erro ao atualizar nota:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// Deletar nota
router_academico.delete("/notas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const nota = await Notas.findByPk(id);

        if (!nota) {
            return res.status(404).json({
                success: false,
                message: "Nota não encontrada"
            });
        }

        await nota.destroy();
        return res.status(200).json({
            success: true,
            message: "Nota deletada com sucesso"
        });

    } catch (error) {
        console.error("Erro ao deletar nota:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

module.exports = router_academico;