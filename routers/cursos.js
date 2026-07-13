const express = require("express");
const router_cursos = express.Router();
const { Cursos } = require("../models/index.js");

// ========== GET - Lista simplificada ==========
router_cursos.get("/lista", async (req, res) => {
    try {
        var cursos = await Cursos.findAll({
            attributes: ['id', 'Nome', 'Valor_curso'],
            order: [['Nome', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            data: cursos
        });
    } catch (error) {
        console.error("Erro ao listar cursos:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_cursos.get("/", async (req, res) => {
    try {
        var cursos = await Cursos.findAll({
            order: [['Nome', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            count: cursos.length,
            data: cursos
        });
    } catch (error) {
        console.error("Erro ao listar cursos:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_cursos.get("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var curso = await Cursos.findByPk(id);

        if (!curso) {
            return res.status(404).json({
                success: false,
                message: "Curso não encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            data: curso
        });
    } catch (error) {
        console.error("Erro ao buscar curso:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_cursos.post("/", async (req, res) => {
    try {
        var { 
            Nome,
            Desc, 
            Tipo_curso, 
            Modulos,
            Edicao,
            Duracao,
            Carga_Horaria,
            Valor_curso,
            Status
        } = req.body;

        if (!Nome) {
            return res.status(400).json({
                success: false,
                message: "O nome do curso é obrigatório"
            });
        }

        // Converter Valor_curso para string, garantir que seja uma string
        var valorCursoString = Valor_curso !== undefined && Valor_curso !== null 
            ? String(Valor_curso) 
            : "0.00";

        var newCurso = await Cursos.create({
            Nome: Nome.trim(),
            Desc: Desc || null,
            Tipo_curso: Tipo_curso || 'Formação profissional inicial',
            Modulos: Modulos || 1,
            Edicao: Edicao || '1º',
            Duracao: Duracao || null,
            Carga_Horaria: Carga_Horaria || null,
            Valor_curso: valorCursoString,  // Agora é uma string
            Status: Status || 'Ativo'
        });

        return res.status(201).json({
            success: true,
            message: "Curso criado com sucesso",
            data: newCurso
        });

    } catch (error) {
        console.error("Erro ao criar curso:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_cursos.put("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var { 
            Nome,
            Desc, 
            Tipo_curso, 
            Modulos,
            Edicao,
            Duracao,
            Carga_Horaria,
            Valor_curso,
            Status
        } = req.body;

        var curso = await Cursos.findByPk(id);

        if (!curso) {
            return res.status(404).json({
                success: false,
                message: "Curso não encontrado"
            });
        }

        // Converter Valor_curso para string se fornecido
        var valorCursoString = Valor_curso !== undefined && Valor_curso !== null 
            ? String(Valor_curso) 
            : curso.Valor_curso;

        await curso.update({
            Nome: Nome ? Nome.trim() : curso.Nome,
            Desc: Desc !== undefined ? Desc : curso.Desc,
            Tipo_curso: Tipo_curso || curso.Tipo_curso,
            Modulos: Modulos || curso.Modulos,
            Edicao: Edicao || curso.Edicao,
            Duracao: Duracao || curso.Duracao,
            Carga_Horaria: Carga_Horaria || curso.Carga_Horaria,
            Valor_curso: valorCursoString,  // Agora é uma string
            Status: Status || curso.Status
        });

        return res.status(200).json({
            success: true,
            message: "Curso atualizado com sucesso",
            data: curso
        });

    } catch (error) {
        console.error("Erro ao atualizar curso:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_cursos.delete("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var curso = await Cursos.findByPk(id);

        if (!curso) {
            return res.status(404).json({
                success: false,
                message: "Curso não encontrado"
            });
        }

        await curso.destroy();

        return res.status(200).json({
            success: true,
            message: "Curso deletado com sucesso"
        });

    } catch (error) {
        console.error("Erro ao deletar curso:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_cursos.get("/tipo/:tipo", async (req, res) => {
    try {
        var { tipo } = req.params;
        var cursos = await Cursos.findAll({
            where: { Tipo_curso: tipo }
        });

        return res.status(200).json({
            success: true,
            count: cursos.length,
            data: cursos
        });

    } catch (error) {
        console.error("Erro ao buscar cursos por tipo:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_cursos.get("/status/:status", async (req, res) => {
    try {
        var { status } = req.params;
        var cursos = await Cursos.findAll({
            where: { Status: status }
        });

        return res.status(200).json({
            success: true,
            count: cursos.length,
            data: cursos
        });

    } catch (error) {
        console.error("Erro ao buscar cursos por status:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_cursos.patch("/:id/status", async (req, res) => {
    try {
        var { id } = req.params;
        var { Status } = req.body;

        if (!Status) {
            return res.status(400).json({
                success: false,
                message: "O status é obrigatório"
            });
        }

        var curso = await Cursos.findByPk(id);

        if (!curso) {
            return res.status(404).json({
                success: false,
                message: "Curso não encontrado"
            });
        }

        await curso.update({ Status });

        return res.status(200).json({
            success: true,
            message: "Status atualizado com sucesso",
            data: curso
        });

    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

module.exports = router_cursos;