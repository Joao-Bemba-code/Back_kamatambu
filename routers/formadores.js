const express = require("express");
const router_formadores = express.Router();
const { Formadores, Turmas } = require("../models/index.js");

// ========== LISTA SIMPLIFICADA ==========
router_formadores.get("/lista", async (req, res) => {
    try {
        var formadores = await Formadores.findAll({
            attributes: ['id', 'Nome', 'Especialidade'],
            where: { Status: 'Ativo' },
            order: [['Nome', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            data: formadores
        });
    } catch (error) {
        console.error("Erro ao listar formadores:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== GET - Listar todos ==========
router_formadores.get("/", async (req, res) => {
    try {
        var formadores = await Formadores.findAll({
            order: [['Nome', 'ASC']]
        });

        for (const formador of formadores) {
            const count = await Turmas.count({
                where: { Formador: formador.Nome }
            });
            formador.Turmas = count;
            await formador.save();
        }

        return res.status(200).json({
            success: true,
            count: formadores.length,
            data: formadores
        });
    } catch (error) {
        console.error("Erro ao listar formadores:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== GET - Buscar por ID ==========
router_formadores.get("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var formador = await Formadores.findByPk(id);

        if (!formador) {
            return res.status(404).json({
                success: false,
                message: "Formador não encontrado"
            });
        }

        const count = await Turmas.count({
            where: { Formador: formador.Nome }
        });
        formador.Turmas = count;

        return res.status(200).json({
            success: true,
            data: formador
        });
    } catch (error) {
        console.error("Erro ao buscar formador:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== POST - Criar ==========
router_formadores.post("/", async (req, res) => {
    try {
        var { 
            Nome, 
            Email, 
            Telefone, 
            Especialidade, 
            Curso,
            Status,
            Genero,
            Data_Nascimento,
            BI,
            Morada,
            Foto,
            Descricao,
            Data_Contratacao
        } = req.body;

        if (!Nome || !Email || !Telefone || !Especialidade || !Curso || !Genero) {
            return res.status(400).json({
                success: false,
                message: "Campos obrigatórios: Nome, Email, Telefone, Especialidade, Curso e Genero"
            });
        }

        var emailExists = await Formadores.findOne({ where: { Email: Email.trim() } });
        if (emailExists) {
            return res.status(409).json({
                success: false,
                message: "Este email já está cadastrado"
            });
        }

        if (BI) {
            var biExists = await Formadores.findOne({ where: { BI: BI.trim() } });
            if (biExists) {
                return res.status(409).json({
                    success: false,
                    message: "Este BI já está cadastrado"
                });
            }
        }

        var newFormador = await Formadores.create({
            Nome: Nome.trim(),
            Email: Email.trim().toLowerCase(),
            Telefone: Telefone.trim(),
            Especialidade: Especialidade.trim(),
            Curso: Curso.trim(),
            Turmas: 0,
            Status: Status || 'Ativo',
            Genero: Genero,
            Data_Nascimento: Data_Nascimento || null,
            BI: BI ? BI.trim() : null,
            Morada: Morada || null,
            Foto: Foto || null,
            Descricao: Descricao || null,
            Data_Contratacao: Data_Contratacao || new Date()
        });

        return res.status(201).json({
            success: true,
            message: "Formador criado com sucesso",
            data: newFormador
        });

    } catch (error) {
        console.error("Erro ao criar formador:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== PUT - Atualizar ==========
router_formadores.put("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var { 
            Nome, 
            Email, 
            Telefone, 
            Especialidade, 
            Curso,
            Status,
            Genero,
            Data_Nascimento,
            BI,
            Morada,
            Foto,
            Descricao,
            Data_Contratacao
        } = req.body;

        var formador = await Formadores.findByPk(id);

        if (!formador) {
            return res.status(404).json({
                success: false,
                message: "Formador não encontrado"
            });
        }

        if (Email && Email !== formador.Email) {
            var emailExists = await Formadores.findOne({ 
                where: { Email: Email.trim() } 
            });
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: "Este email já está cadastrado por outro formador"
                });
            }
        }

        if (BI && BI !== formador.BI) {
            var biExists = await Formadores.findOne({ 
                where: { BI: BI.trim() } 
            });
            if (biExists) {
                return res.status(409).json({
                    success: false,
                    message: "Este BI já está cadastrado por outro formador"
                });
            }
        }

        const turmasCount = await Turmas.count({
            where: { Formador: Nome || formador.Nome }
        });

        await formador.update({
            Nome: Nome ? Nome.trim() : formador.Nome,
            Email: Email ? Email.trim().toLowerCase() : formador.Email,
            Telefone: Telefone ? Telefone.trim() : formador.Telefone,
            Especialidade: Especialidade ? Especialidade.trim() : formador.Especialidade,
            Curso: Curso ? Curso.trim() : formador.Curso,
            Turmas: turmasCount,
            Status: Status || formador.Status,
            Genero: Genero || formador.Genero,
            Data_Nascimento: Data_Nascimento || formador.Data_Nascimento,
            BI: BI ? BI.trim() : formador.BI,
            Morada: Morada || formador.Morada,
            Foto: Foto || formador.Foto,
            Descricao: Descricao || formador.Descricao,
            Data_Contratacao: Data_Contratacao || formador.Data_Contratacao
        });

        return res.status(200).json({
            success: true,
            message: "Formador atualizado com sucesso",
            data: formador
        });

    } catch (error) {
        console.error("Erro ao atualizar formador:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== DELETE ==========
router_formadores.delete("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var formador = await Formadores.findByPk(id);

        if (!formador) {
            return res.status(404).json({
                success: false,
                message: "Formador não encontrado"
            });
        }

        await formador.destroy();

        return res.status(200).json({
            success: true,
            message: "Formador deletado com sucesso"
        });

    } catch (error) {
        console.error("Erro ao deletar formador:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== GET - Buscar turmas do formador ==========
router_formadores.get("/:id/turmas", async (req, res) => {
    try {
        var { id } = req.params;
        var formador = await Formadores.findByPk(id);

        if (!formador) {
            return res.status(404).json({
                success: false,
                message: "Formador não encontrado"
            });
        }

        var turmas = await Turmas.findAll({
            where: { Formador: formador.Nome }
        });

        return res.status(200).json({
            success: true,
            count: turmas.length,
            data: turmas
        });

    } catch (error) {
        console.error("Erro ao buscar turmas do formador:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_formadores.get("/curso/:curso", async (req, res) => {
    try {
        var { curso } = req.params;
        var formadores = await Formadores.findAll({
            where: { Curso: curso },
            order: [['Nome', 'ASC']]
        });

        for (const formador of formadores) {
            const count = await Turmas.count({
                where: { Formador: formador.Nome }
            });
            formador.Turmas = count;
            await formador.save();
        }

        return res.status(200).json({
            success: true,
            count: formadores.length,
            data: formadores
        });

    } catch (error) {
        console.error("Erro ao buscar formadores por curso:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_formadores.get("/status/ativo", async (req, res) => {
    try {
        var formadores = await Formadores.findAll({
            where: { Status: 'Ativo' },
            order: [['Nome', 'ASC']]
        });

        for (const formador of formadores) {
            const count = await Turmas.count({
                where: { Formador: formador.Nome }
            });
            formador.Turmas = count;
            await formador.save();
        }

        return res.status(200).json({
            success: true,
            count: formadores.length,
            data: formadores
        });

    } catch (error) {
        console.error("Erro ao buscar formadores ativos:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

router_formadores.patch("/:id/status", async (req, res) => {
    try {
        var { id } = req.params;
        var { Status } = req.body;

        if (!Status) {
            return res.status(400).json({
                success: false,
                message: "O status é obrigatório"
            });
        }

        var formador = await Formadores.findByPk(id);

        if (!formador) {
            return res.status(404).json({
                success: false,
                message: "Formador não encontrado"
            });
        }

        await formador.update({ Status });

        return res.status(200).json({
            success: true,
            message: "Status atualizado com sucesso",
            data: formador
        });

    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

module.exports = router_formadores;