const express = require("express");
const router_matriculas = express.Router();
const { Sequelize } = require("../config/index.js");
const { Matriculas, Formadores, Turmas, Pagamentos, Cursos } = require("../models/index.js");

async function obterTurmasDoFormador(req) {
    var formador = null;
    if (req.user.formador_id) {
        formador = await Formadores.findByPk(req.user.formador_id);
    }
    if (!formador && req.user.nome) {
        formador = await Formadores.findOne({ where: { Nome: req.user.nome } });
    }
    if (!formador) return [];
    var turmas = await Turmas.findAll({ where: { Formador: formador.Nome } });
    return turmas.map(t => t.Turma).filter(Boolean);
}

router_matriculas.get("/", async (req, res) => {
    try {
        var where = {};
        if (req.user && req.user.tipo === 'formador') {
            var nomesTurmas = await obterTurmasDoFormador(req);
            where = { Turma: { [Sequelize.Op.in]: nomesTurmas } };
        }
        var matriculas = await Matriculas.findAll({
            where,
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
            Foto_Certificado,
            Data_Matricula
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
            Modulo: Modulo ? parseInt(Modulo) : 1,
            Turma: Turma.trim(),
            Status: Status || 'Inscrito',
            Foto_User: Foto_User || null,
            Foto_Certificado: Foto_Certificado || null,
            Data_Matricula: Data_Matricula || new Date().toISOString().split('T')[0]
        });

        // ===== Auto-criar mensalidades para cursos com paga_mensal = 'sim' =====
        // Lógica: o pagamento é mensal. O valor de cada mensalidade é o
        // Valor_curso (pagamento mensal). O mês 1 vence no dia 5 do mês de
        // referência e os meses seguintes vencem no dia 5 de cada mês
        // subsequente, até fechar o ciclo de X meses. O vencimento é no dia 5
        // de cada mês; a partir do dia 6 do próprio mês a mensalidade não paga
        // é considerada dívida. O mês de referência inicial é o mês de início
        // da turma quando disponível, senão o mês da matrícula.
        var mensalidadesCriadas = 0;
        try {
            var cursoInfo = await Cursos.findOne({ where: { Nome: newMatricula.Curso } });
            if (cursoInfo && parseInt(cursoInfo.Modulos) > 1 && cursoInfo.paga_mensal === 'sim') {
                var modulos = parseInt(cursoInfo.Modulos);
                var valorMensal = parseFloat(cursoInfo.Valor_curso) || 0;
                if (valorMensal > 0) {
                    var turmaInfo = newMatricula.Turma ? await Turmas.findOne({ where: { Turma: newMatricula.Turma } }) : null;
                    var dataRef = turmaInfo && turmaInfo.Data_INIC ? new Date(turmaInfo.Data_INIC) : new Date(newMatricula.Data_Matricula);
                    if (isNaN(dataRef.getTime())) dataRef = new Date(newMatricula.Data_Matricula);
                    for (var k = 1; k <= modulos; k++) {
                        var vencimento = new Date(dataRef.getFullYear(), dataRef.getMonth() + (k - 1), 5);
                        var vencStr = vencimento.toISOString().split('T')[0];
                        var refMes = vencimento.getFullYear() + '-' + String(vencimento.getMonth() + 1).padStart(2, '0');
                        var mesNome = vencimento.toLocaleString('pt-PT', { month: 'long', year: 'numeric' });
                        await Pagamentos.create({
                            aluno: newMatricula.Nome,
                            aluno_id: newMatricula.id,
                            curso: newMatricula.Curso,
                            turma: newMatricula.Turma,
                            tipo: 'mensalidade',
                            forma_pagamento: 'dinheiro',
                            valor: valorMensal,
                            status: 'pendente',
                            data_pagamento: null,
                            data_vencimento: vencStr,
                            observacao: 'Mensalidade automatica - Modulo ' + k + ' de ' + modulos + ' (' + mesNome + ')'
                        });
                        mensalidadesCriadas++;
                    }
                }
            }
        } catch (errAuto) {
            console.warn('Nao foi possivel auto-criar mensalidades:', errAuto.message);
        }

        var mensagemFinal = 'Matricula criada com sucesso';
        if (mensalidadesCriadas > 0) {
            mensagemFinal += '. ' + mensalidadesCriadas + ' mensalidade(s) automatica(s) gerada(s) para o curso multi-mes';
        }

        return res.status(201).json({
            success: true,
            message: mensagemFinal,
            data: newMatricula,
            mensalidadesCriadas: mensalidadesCriadas
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
            Foto_Certificado,
            Data_Matricula
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
            Modulo: Modulo ? parseInt(Modulo) : matricula.Modulo,
            Turma: Turma ? Turma.trim() : matricula.Turma,
            Status: Status || matricula.Status,
            Foto_User: Foto_User || matricula.Foto_User,
            Foto_Certificado: Foto_Certificado || matricula.Foto_Certificado,
            Data_Matricula: Data_Matricula || matricula.Data_Matricula
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