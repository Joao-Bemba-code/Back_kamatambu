const express = require("express");
const router_turmas = express.Router();
const { Turmas, Matriculas } = require("../models/index.js");

// ========== GET - Listar todas as turmas ==========
router_turmas.get("/", async (req, res) => {
    try {
        var turmas = await Turmas.findAll({
            order: [['createdAt', 'DESC']]
        });

        for (const turma of turmas) {
            const count = await Matriculas.count({
                where: { 
                    Turma: turma.Turma,
                    Status: ['Inscrito', 'Admitido', 'Ativo']
                }
            });
            turma.Numero_Alunos = count;
            await turma.save();
        }

        return res.status(200).json({
            success: true,
            count: turmas.length,
            data: turmas
        });
    } catch (error) {
        console.error("Erro ao listar turmas:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== GET - Buscar turma por ID ==========
router_turmas.get("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var turma = await Turmas.findByPk(id);

        if (!turma) {
            return res.status(404).json({
                success: false,
                message: "Turma não encontrada"
            });
        }

        const count = await Matriculas.count({
            where: { 
                Turma: turma.Turma,
                Status: ['Inscrito', 'Admitido', 'Ativo']
            }
        });
        turma.Numero_Alunos = count;

        return res.status(200).json({
            success: true,
            data: turma
        });
    } catch (error) {
        console.error("Erro ao buscar turma:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== POST - Criar nova turma ==========
router_turmas.post("/", async (req, res) => {
    try {
        var { 
            Turma, 
            Curso, 
            Modulo, 
            Periodo, 
            Capacidade_Maxima,
            Data_INIC, 
            Data_Term,
            Status,
            Formador,
            Sala
        } = req.body;

        if (!Turma || !Curso || !Data_INIC || !Data_Term) {
            return res.status(400).json({
                success: false,
                message: "Campos obrigatórios: Turma, Curso, Data_INIC e Data_Term"
            });
        }

        var newTurma = await Turmas.create({
            Turma: Turma.trim(),
            Curso: Curso.trim(),
            Modulo: Modulo || 1,
            Periodo: Periodo || 'Manhã',
            Numero_Alunos: 0,
            Capacidade_Maxima: Capacidade_Maxima || 30,
            Data_INIC: Data_INIC,
            Data_Term: Data_Term,
            Status: Status || 'Pendente',
            Formador: Formador || null,
            Sala: Sala || null
        });

        return res.status(201).json({
            success: true,
            message: "Turma criada com sucesso",
            data: newTurma
        });

    } catch (error) {
        console.error("Erro ao criar turma:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== PUT - Atualizar turma ==========
router_turmas.put("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var { 
            Turma, 
            Curso, 
            Modulo, 
            Periodo, 
            Capacidade_Maxima,
            Data_INIC, 
            Data_Term,
            Status,
            Formador,
            Sala
        } = req.body;

        var turma = await Turmas.findByPk(id);

        if (!turma) {
            return res.status(404).json({
                success: false,
                message: "Turma não encontrada"
            });
        }

        const count = await Matriculas.count({
            where: { 
                Turma: Turma || turma.Turma,
                Status: ['Inscrito', 'Admitido', 'Ativo']
            }
        });

        await turma.update({
            Turma: Turma ? Turma.trim() : turma.Turma,
            Curso: Curso ? Curso.trim() : turma.Curso,
            Modulo: Modulo || turma.Modulo,
            Periodo: Periodo || turma.Periodo,
            Numero_Alunos: count,
            Capacidade_Maxima: Capacidade_Maxima || turma.Capacidade_Maxima,
            Data_INIC: Data_INIC || turma.Data_INIC,
            Data_Term: Data_Term || turma.Data_Term,
            Status: Status || turma.Status,
            Formador: Formador || turma.Formador,
            Sala: Sala || turma.Sala
        });

        return res.status(200).json({
            success: true,
            message: "Turma atualizada com sucesso",
            data: turma
        });

    } catch (error) {
        console.error("Erro ao atualizar turma:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== DELETE - Deletar turma ==========
router_turmas.delete("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var turma = await Turmas.findByPk(id);

        if (!turma) {
            return res.status(404).json({
                success: false,
                message: "Turma não encontrada"
            });
        }

        await turma.destroy();

        return res.status(200).json({
            success: true,
            message: "Turma deletada com sucesso"
        });

    } catch (error) {
        console.error("Erro ao deletar turma:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== GET - Buscar turmas por curso ==========
router_turmas.get("/curso/:curso", async (req, res) => {
    try {
        var { curso } = req.params;
        var turmas = await Turmas.findAll({
            where: { Curso: curso }
        });

        for (const turma of turmas) {
            const count = await Matriculas.count({
                where: { 
                    Turma: turma.Turma,
                    Status: ['Inscrito', 'Admitido', 'Ativo']
                }
            });
            turma.Numero_Alunos = count;
            await turma.save();
        }

        return res.status(200).json({
            success: true,
            count: turmas.length,
            data: turmas
        });

    } catch (error) {
        console.error("Erro ao buscar turmas por curso:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== GET - Buscar turmas por formador ==========
router_turmas.get("/formador/:formador", async (req, res) => {
    try {
        var { formador } = req.params;
        var turmas = await Turmas.findAll({
            where: { Formador: formador }
        });

        for (const turma of turmas) {
            const count = await Matriculas.count({
                where: { 
                    Turma: turma.Turma,
                    Status: ['Inscrito', 'Admitido', 'Ativo']
                }
            });
            turma.Numero_Alunos = count;
            await turma.save();
        }

        return res.status(200).json({
            success: true,
            count: turmas.length,
            data: turmas
        });

    } catch (error) {
        console.error("Erro ao buscar turmas por formador:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== GET - Buscar turmas por status ==========
router_turmas.get("/status/:status", async (req, res) => {
    try {
        var { status } = req.params;
        var turmas = await Turmas.findAll({
            where: { Status: status }
        });

        return res.status(200).json({
            success: true,
            count: turmas.length,
            data: turmas
        });

    } catch (error) {
        console.error("Erro ao buscar turmas por status:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== GET - Buscar turmas por período ==========
router_turmas.get("/periodo/:periodo", async (req, res) => {
    try {
        var { periodo } = req.params;
        var turmas = await Turmas.findAll({
            where: { Periodo: periodo }
        });

        return res.status(200).json({
            success: true,
            count: turmas.length,
            data: turmas
        });

    } catch (error) {
        console.error("Erro ao buscar turmas por período:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== PATCH - Atualizar status ==========
router_turmas.patch("/:id/status", async (req, res) => {
    try {
        var { id } = req.params;
        var { Status } = req.body;

        if (!Status) {
            return res.status(400).json({
                success: false,
                message: "O status é obrigatório"
            });
        }

        var turma = await Turmas.findByPk(id);

        if (!turma) {
            return res.status(404).json({
                success: false,
                message: "Turma não encontrada"
            });
        }

        await turma.update({ Status });

        return res.status(200).json({
            success: true,
            message: "Status atualizado com sucesso",
            data: turma
        });

    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

module.exports = router_turmas;