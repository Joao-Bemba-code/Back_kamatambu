const express = require("express");
const router_matriculas = express.Router();
const { Matriculas } = require("../models/index.js");

router_matriculas.get("/", async (req, res) => {
    try {
        var matriculas = await Matriculas.findAll({
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            count: matriculas.length,
            data: matriculas
        });
    } catch (error) {
        console.error("Erro ao listar matrículas:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_matriculas.get("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var matricula = await Matriculas.findByPk(id);

        if (!matricula) {
            return res.status(404).json({
                success: false,
                message: "Matrícula não encontrada"
            });
        }

        return res.status(200).json({
            success: true,
            data: matricula
        });
    } catch (error) {
        console.error("Erro ao buscar matrícula:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_matriculas.post("/", async (req, res) => {
    try {
        var { 
            Nome, 
            Encarregado, 
            Morada, 
            BI_Cedula, 
            Nascimento, 
            Estado_Civil, 
            Genero, 
            Telefone, 
            Curso, 
            Modulo, 
            Turma,
            Status,
            Foto_User,
            Foto_Certificado
        } = req.body;

        if (!Nome || !Genero || !Telefone || !Curso || !Turma) {
            return res.status(400).json({
                success: false,
                message: "Campos obrigatórios: Nome, Genero, Telefone, Curso e Turma"
            });
        }

        var newMatricula = await Matriculas.create({
            Nome: Nome.trim(),
            Encarregado: Encarregado ? Encarregado.trim() : null,
            Morada: Morada || null,
            BI_Cedula: BI_Cedula || null,
            Nascimento: Nascimento || null,
            Estado_Civil: Estado_Civil || 'Solteiro',
            Genero: Genero,
            Telefone: Telefone.trim(),
            Curso: Curso.trim(),
            Modulo: Modulo || 1,
            Turma: Turma.trim(),
            Status: Status || 'Inscrito',
            Foto_User: Foto_User || null,
            Foto_Certificado: Foto_Certificado || null
        });

        return res.status(201).json({
            success: true,
            message: "Matrícula criada com sucesso",
            data: newMatricula
        });

    } catch (error) {
        console.error("Erro ao criar matrícula:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_matriculas.put("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var { 
            Nome, 
            Encarregado, 
            Morada, 
            BI_Cedula, 
            Nascimento, 
            Estado_Civil, 
            Genero, 
            Telefone, 
            Curso, 
            Modulo, 
            Turma,
            Status,
            Foto_User,
            Foto_Certificado
        } = req.body;

        var matricula = await Matriculas.findByPk(id);

        if (!matricula) {
            return res.status(404).json({
                success: false,
                message: "Matrícula não encontrada"
            });
        }

        await matricula.update({
            Nome: Nome ? Nome.trim() : matricula.Nome,
            Encarregado: Encarregado ? Encarregado.trim() : matricula.Encarregado,
            Morada: Morada || matricula.Morada,
            BI_Cedula: BI_Cedula || matricula.BI_Cedula,
            Nascimento: Nascimento || matricula.Nascimento,
            Estado_Civil: Estado_Civil || matricula.Estado_Civil,
            Genero: Genero || matricula.Genero,
            Telefone: Telefone ? Telefone.trim() : matricula.Telefone,
            Curso: Curso ? Curso.trim() : matricula.Curso,
            Modulo: Modulo || matricula.Modulo,
            Turma: Turma ? Turma.trim() : matricula.Turma,
            Status: Status || matricula.Status,
            Foto_User: Foto_User || matricula.Foto_User,
            Foto_Certificado: Foto_Certificado || matricula.Foto_Certificado
        });

        return res.status(200).json({
            success: true,
            message: "Matrícula atualizada com sucesso",
            data: matricula
        });

    } catch (error) {
        console.error("Erro ao atualizar matrícula:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_matriculas.delete("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var matricula = await Matriculas.findByPk(id);

        if (!matricula) {
            return res.status(404).json({
                success: false,
                message: "Matrícula não encontrada"
            });
        }

        await matricula.destroy();

        return res.status(200).json({
            success: true,
            message: "Matrícula deletada com sucesso"
        });

    } catch (error) {
        console.error("Erro ao deletar matrícula:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_matriculas.get("/curso/:curso", async (req, res) => {
    try {
        var { curso } = req.params;
        var matriculas = await Matriculas.findAll({
            where: { Curso: curso }
        });

        return res.status(200).json({
            success: true,
            count: matriculas.length,
            data: matriculas
        });

    } catch (error) {
        console.error("Erro ao buscar matrículas por curso:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_matriculas.get("/turma/:turma", async (req, res) => {
    try {
        var { turma } = req.params;
        var matriculas = await Matriculas.findAll({
            where: { Turma: turma }
        });

        return res.status(200).json({
            success: true,
            count: matriculas.length,
            data: matriculas
        });

    } catch (error) {
        console.error("Erro ao buscar matrículas por turma:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_matriculas.get("/status/:status", async (req, res) => {
    try {
        var { status } = req.params;
        var matriculas = await Matriculas.findAll({
            where: { Status: status }
        });

        return res.status(200).json({
            success: true,
            count: matriculas.length,
            data: matriculas
        });

    } catch (error) {
        console.error("Erro ao buscar matrículas por status:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_matriculas.patch("/:id/status", async (req, res) => {
    try {
        var { id } = req.params;
        var { Status } = req.body;

        if (!Status) {
            return res.status(400).json({
                success: false,
                message: "O status é obrigatório"
            });
        }

        var matricula = await Matriculas.findByPk(id);

        if (!matricula) {
            return res.status(404).json({
                success: false,
                message: "Matrícula não encontrada"
            });
        }

        await matricula.update({ Status });

        return res.status(200).json({
            success: true,
            message: "Status atualizado com sucesso",
            data: matricula
        });

    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

module.exports = router_matriculas;