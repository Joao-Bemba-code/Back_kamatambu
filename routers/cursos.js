const express = require("express");
const router_cursos = express.Router();
const { Cursos } = require("../models/index.js");

// ========== FUNÇÕES AUXILIARES ==========
function validarValorMonetario(valor) {
    if (!valor) return true;
    const valorLimpo = valor.toString()
        .replace(/\s/g, '')
        .replace(/R\$/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '.');
    const numero = parseFloat(valorLimpo);
    return !isNaN(numero) && numero >= 0;
}

function formatarValorMonetario(valor) {
    if (!valor) return "0.00";
    const valorLimpo = valor.toString()
        .replace(/\s/g, '')
        .replace(/R\$/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '.');
    const numero = parseFloat(valorLimpo);
    return numero.toFixed(2);
}

router_cursos.get("/lista", async (req, res) => {
    try {
        const cursos = await Cursos.findAll({
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
        const cursos = await Cursos.findAll({
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
        const { id } = req.params;
        const curso = await Cursos.findByPk(id);

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
        const { 
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

        if (Valor_curso && !validarValorMonetario(Valor_curso)) {
            return res.status(400).json({
                success: false,
                message: "O Valor_curso deve ser um valor monetário válido"
            });
        }

        if (Modulos && (isNaN(parseInt(Modulos)) || parseInt(Modulos) < 1)) {
            return res.status(400).json({
                success: false,
                message: "O campo Modulos deve ser um número maior ou igual a 1"
            });
        }

        if (Carga_Horaria && (isNaN(parseInt(Carga_Horaria)) || parseInt(Carga_Horaria) < 0)) {
            return res.status(400).json({
                success: false,
                message: "O campo Carga_Horaria deve ser um número maior ou igual a 0"
            });
        }

        const edicoesValidas = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º'];
        if (Edicao && !edicoesValidas.includes(Edicao)) {
            return res.status(400).json({
                success: false,
                message: "Edição inválida. Use: " + edicoesValidas.join(', ')
            });
        }

        const statusValidos = ['Ativo', 'Inativo', 'Em desenvolvimento'];
        if (Status && !statusValidos.includes(Status)) {
            return res.status(400).json({
                success: false,
                message: "Status inválido. Use: " + statusValidos.join(', ')
            });
        }

        const valorCursoFormatado = Valor_curso ? formatarValorMonetario(Valor_curso) : "0.00";

        const newCurso = await Cursos.create({
            Nome: Nome.trim(),
            Desc: Desc || null,
            Tipo_curso: Tipo_curso || 'Formação profissional inicial',
            Modulos: Modulos ? parseInt(Modulos) : 1,
            Edicao: Edicao || '1º',
            Duracao: Duracao || null,
            Carga_Horaria: Carga_Horaria ? parseInt(Carga_Horaria) : null,
            Valor_curso: valorCursoFormatado,
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
        const { id } = req.params;
        const { 
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

        const curso = await Cursos.findByPk(id);

        if (!curso) {
            return res.status(404).json({
                success: false,
                message: "Curso não encontrado"
            });
        }

        if (Valor_curso !== undefined && Valor_curso !== null && !validarValorMonetario(Valor_curso)) {
            return res.status(400).json({
                success: false,
                message: "O Valor_curso deve ser um valor monetário válido"
            });
        }

        if (Modulos !== undefined && (isNaN(parseInt(Modulos)) || parseInt(Modulos) < 1)) {
            return res.status(400).json({
                success: false,
                message: "O campo Modulos deve ser um número maior ou igual a 1"
            });
        }

        if (Carga_Horaria !== undefined && (isNaN(parseInt(Carga_Horaria)) || parseInt(Carga_Horaria) < 0)) {
            return res.status(400).json({
                success: false,
                message: "O campo Carga_Horaria deve ser um número maior ou igual a 0"
            });
        }

        const edicoesValidas = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º'];
        if (Edicao !== undefined && !edicoesValidas.includes(Edicao)) {
            return res.status(400).json({
                success: false,
                message: "Edição inválida. Use: " + edicoesValidas.join(', ')
            });
        }

        const statusValidos = ['Ativo', 'Inativo', 'Em desenvolvimento'];
        if (Status !== undefined && !statusValidos.includes(Status)) {
            return res.status(400).json({
                success: false,
                message: "Status inválido. Use: " + statusValidos.join(', ')
            });
        }

        const valorCursoFormatado = Valor_curso !== undefined && Valor_curso !== null 
            ? formatarValorMonetario(Valor_curso) 
            : curso.Valor_curso;

        await curso.update({
            Nome: Nome ? Nome.trim() : curso.Nome,
            Desc: Desc !== undefined ? Desc : curso.Desc,
            Tipo_curso: Tipo_curso || curso.Tipo_curso,
            Modulos: Modulos !== undefined ? parseInt(Modulos) : curso.Modulos,
            Edicao: Edicao || curso.Edicao,
            Duracao: Duracao !== undefined ? Duracao : curso.Duracao,
            Carga_Horaria: Carga_Horaria !== undefined ? parseInt(Carga_Horaria) : curso.Carga_Horaria,
            Valor_curso: valorCursoFormatado,
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
        const { id } = req.params;
        const curso = await Cursos.findByPk(id);

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
        const { tipo } = req.params;
        const cursos = await Cursos.findAll({
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
        const { status } = req.params;
        const cursos = await Cursos.findAll({
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
        const { id } = req.params;
        const { Status } = req.body;

        if (!Status) {
            return res.status(400).json({
                success: false,
                message: "O status é obrigatório"
            });
        }

        const statusValidos = ['Ativo', 'Inativo', 'Em desenvolvimento'];
        if (!statusValidos.includes(Status)) {
            return res.status(400).json({
                success: false,
                message: "Status inválido. Use: " + statusValidos.join(', ')
            });
        }

        const curso = await Cursos.findByPk(id);

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