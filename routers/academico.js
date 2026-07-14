// routers/academico.js
const express = require("express");
const router_academico = express.Router();
const { Notas, Frequencia, Boletim, Matriculas, Turmas, Formadores } = require("../models/index.js");
const { Op } = require("sequelize");

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
            where: { aluno_id },
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

// Listar notas por turma
router_academico.get("/notas/turma/:turma", async (req, res) => {
    try {
        const { turma } = req.params;
        const notas = await Notas.findAll({
            where: { turma }
        });
        return res.status(200).json({
            success: true,
            data: notas
        });
    } catch (error) {
        console.error("Erro ao buscar notas da turma:", error);
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

        // Validar se aluno existe
        const matricula = await Matriculas.findByPk(aluno_id);
        if (!matricula) {
            return res.status(404).json({
                success: false,
                message: "Aluno não encontrado"
            });
        }

        // Calcular status baseado na nota
        let status = 'pendente';
        if (nota >= 10) status = 'aprovado';
        else if (nota >= 7) status = 'recuperacao';
        else if (nota < 7) status = 'reprovado';

        const newNota = await Notas.create({
            aluno_id,
            aluno,
            curso,
            turma,
            disciplina,
            modulo,
            tipo_avaliacao,
            nota: parseFloat(nota),
            peso: peso || 1.00,
            data_avaliacao: data_avaliacao || null,
            observacao,
            formador_id: formador_id || null,
            formador: formador || null,
            status
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
            message: "Erro interno do servidor"
        });
    }
});

// Atualizar nota
router_academico.put("/notas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nota, tipo_avaliacao, observacao, status } = req.body;

        const notaExistente = await Notas.findByPk(id);
        if (!notaExistente) {
            return res.status(404).json({
                success: false,
                message: "Nota não encontrada"
            });
        }

        let novoStatus = status;
        if (nota !== undefined) {
            if (nota >= 10) novoStatus = 'aprovado';
            else if (nota >= 7) novoStatus = 'recuperacao';
            else if (nota < 7) novoStatus = 'reprovado';
        }

        await notaExistente.update({
            nota: nota !== undefined ? parseFloat(nota) : notaExistente.nota,
            tipo_avaliacao: tipo_avaliacao || notaExistente.tipo_avaliacao,
            observacao: observacao || notaExistente.observacao,
            status: novoStatus || notaExistente.status
        });

        // Atualizar boletim do aluno
        await atualizarBoletim(notaExistente.aluno_id, notaExistente.curso, notaExistente.turma, notaExistente.modulo);

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

// ========== FREQUÊNCIA ==========

// Listar frequência
router_academico.get("/frequencia", async (req, res) => {
    try {
        const frequencias = await Frequencia.findAll({
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({
            success: true,
            data: frequencias
        });
    } catch (error) {
        console.error("Erro ao listar frequências:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// Listar frequência por aluno
router_academico.get("/frequencia/aluno/:aluno_id", async (req, res) => {
    try {
        const { aluno_id } = req.params;
        const frequencias = await Frequencia.findAll({
            where: { aluno_id }
        });
        return res.status(200).json({
            success: true,
            data: frequencias
        });
    } catch (error) {
        console.error("Erro ao buscar frequência do aluno:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// Registrar frequência
router_academico.post("/frequencia", async (req, res) => {
    try {
        const { 
            aluno_id, aluno, curso, turma, disciplina, modulo,
            data_aula, presente, horas_aula, observacao,
            formador_id, formador
        } = req.body;

        const newFrequencia = await Frequencia.create({
            aluno_id,
            aluno,
            curso,
            turma,
            disciplina,
            modulo,
            data_aula,
            presente,
            horas_aula: horas_aula || 2,
            observacao,
            formador_id: formador_id || null,
            formador: formador || null
        });

        return res.status(201).json({
            success: true,
            message: "Frequência registrada com sucesso",
            data: newFrequencia
        });

    } catch (error) {
        console.error("Erro ao registrar frequência:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== BOLETIM ==========

// Listar boletins
router_academico.get("/boletins", async (req, res) => {
    try {
        const boletins = await Boletim.findAll({
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({
            success: true,
            data: boletins
        });
    } catch (error) {
        console.error("Erro ao listar boletins:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// Gerar boletim do aluno
router_academico.post("/boletins/gerar/:aluno_id", async (req, res) => {
    try {
        const { aluno_id } = req.params;
        const { modulo } = req.body;

        const matricula = await Matriculas.findByPk(aluno_id);
        if (!matricula) {
            return res.status(404).json({
                success: false,
                message: "Aluno não encontrado"
            });
        }

        // Buscar todas as notas do aluno no módulo
        const notas = await Notas.findAll({
            where: {
                aluno_id,
                modulo: modulo || matricula.Modulo
            }
        });

        if (notas.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Nenhuma nota encontrada para este aluno no módulo"
            });
        }

        // Calcular média final
        const somaNotas = notas.reduce((sum, n) => sum + parseFloat(n.nota), 0);
        const mediaFinal = (somaNotas / notas.length).toFixed(2);

        // Determinar situação
        let situacao = 'aprovado';
        if (mediaFinal >= 10) situacao = 'aprovado';
        else if (mediaFinal >= 7) situacao = 'recuperacao';
        else if (mediaFinal < 7) situacao = 'reprovado';

        // Gerar boletim
        const boletim = await Boletim.create({
            aluno_id,
            aluno: matricula.Nome,
            curso: matricula.Curso,
            turma: matricula.Turma,
            modulo: modulo || matricula.Modulo,
            media_final: parseFloat(mediaFinal),
            situacao,
            data_emissao: new Date().toISOString().split('T')[0],
            observacao: `Boletim gerado com base em ${notas.length} avaliações`,
            formador: req.body.formador || null
        });

        return res.status(201).json({
            success: true,
            message: "Boletim gerado com sucesso",
            data: {
                boletim,
                notas,
                mediaFinal,
                situacao
            }
        });

    } catch (error) {
        console.error("Erro ao gerar boletim:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== FUNÇÃO AUXILIAR ==========
async function atualizarBoletim(aluno_id, curso, turma, modulo) {
    try {
        // Buscar todas as notas do aluno no módulo
        const notas = await Notas.findAll({
            where: {
                aluno_id,
                modulo
            }
        });

        if (notas.length === 0) return;

        // Calcular média
        const somaNotas = notas.reduce((sum, n) => sum + parseFloat(n.nota), 0);
        const mediaFinal = (somaNotas / notas.length).toFixed(2);

        // Determinar situação
        let situacao = 'aprovado';
        if (mediaFinal >= 10) situacao = 'aprovado';
        else if (mediaFinal >= 7) situacao = 'recuperacao';
        else if (mediaFinal < 7) situacao = 'reprovado';

        // Atualizar ou criar boletim
        await Boletim.upsert({
            aluno_id,
            aluno: (await Matriculas.findByPk(aluno_id)).Nome,
            curso,
            turma,
            modulo,
            media_final: parseFloat(mediaFinal),
            situacao,
            data_emissao: new Date().toISOString().split('T')[0],
            observacao: `Atualizado automaticamente`
        });

    } catch (error) {
        console.error("Erro ao atualizar boletim:", error);
    }
}

module.exports = router_academico;