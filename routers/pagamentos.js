// routers/pagamentos.js
const express = require("express");
const router_pagamentos = express.Router();
const { Pagamentos, Matriculas } = require("../models/index.js");
const { Op } = require("sequelize");
const { sequelize } = require("../config/index.js");

// ========== LISTAR TODOS OS PAGAMENTOS ==========
router_pagamentos.get("/", async (req, res) => {
    try {
        var pagamentos = await Pagamentos.findAll({
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            count: pagamentos.length,
            data: pagamentos
        });
    } catch (error) {
        console.error("Erro ao listar pagamentos:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== CRIAR NOVO PAGAMENTO ==========
router_pagamentos.post("/", async (req, res) => {
    try {
        var { 
            aluno, 
            aluno_id,
            curso, 
            turma,
            tipo, 
            forma_pagamento, 
            valor, 
            status,
            data_pagamento,
            data_vencimento,
            observacao,
            comprovante,
            desconto,
            multa
        } = req.body;

        if (!aluno) {
            return res.status(400).json({
                success: false,
                message: "O nome do aluno é obrigatório"
            });
        }

        if (!curso) {
            return res.status(400).json({
                success: false,
                message: "O curso é obrigatório"
            });
        }

        if (!valor || parseFloat(valor) <= 0) {
            return res.status(400).json({
                success: false,
                message: "O valor deve ser maior que zero"
            });
        }

        if (aluno_id) {
            var matricula = await Matriculas.findByPk(aluno_id);
            if (!matricula) {
                return res.status(404).json({
                    success: false,
                    message: "Aluno não encontrado"
                });
            }
        }

        var newPagamento = await Pagamentos.create({
            aluno: aluno.trim(),
            aluno_id: aluno_id || null,
            curso: curso.trim(),
            turma: turma || null,
            tipo: tipo || 'mensalidade',
            forma_pagamento: forma_pagamento || 'dinheiro',
            valor: parseFloat(valor),
            status: status || 'pendente',
            data_pagamento: data_pagamento || null,
            data_vencimento: data_vencimento || null,
            observacao: observacao || null,
            comprovante: comprovante || null,
            desconto: desconto || 0,
            multa: multa || 0,
            usuario_criou: 'admin'
        });

        if (aluno_id && status === 'pago') {
            await Matriculas.update(
                { Status: 'Ativo' },
                { where: { id: aluno_id } }
            );
        }

        return res.status(201).json({
            success: true,
            message: "Pagamento registrado com sucesso",
            data: newPagamento
        });

    } catch (error) {
        console.error("Erro ao criar pagamento:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== ATUALIZAR PAGAMENTO ==========
router_pagamentos.put("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var { 
            aluno, 
            aluno_id,
            curso, 
            turma,
            tipo, 
            forma_pagamento, 
            valor, 
            status,
            data_pagamento,
            data_vencimento,
            observacao,
            comprovante,
            desconto,
            multa
        } = req.body;

        var pagamento = await Pagamentos.findByPk(id);

        if (!pagamento) {
            return res.status(404).json({
                success: false,
                message: "Pagamento não encontrado"
            });
        }

        await pagamento.update({
            aluno: aluno ? aluno.trim() : pagamento.aluno,
            aluno_id: aluno_id || pagamento.aluno_id,
            curso: curso ? curso.trim() : pagamento.curso,
            turma: turma || pagamento.turma,
            tipo: tipo || pagamento.tipo,
            forma_pagamento: forma_pagamento || pagamento.forma_pagamento,
            valor: valor ? parseFloat(valor) : pagamento.valor,
            status: status || pagamento.status,
            data_pagamento: data_pagamento || pagamento.data_pagamento,
            data_vencimento: data_vencimento || pagamento.data_vencimento,
            observacao: observacao || pagamento.observacao,
            comprovante: comprovante || pagamento.comprovante,
            desconto: desconto || pagamento.desconto,
            multa: multa || pagamento.multa,
            usuario_atualizou: 'admin'
        });

        if (pagamento.aluno_id && status === 'pago' && pagamento.status !== 'pago') {
            await Matriculas.update(
                { Status: 'Ativo' },
                { where: { id: pagamento.aluno_id } }
            );
        }

        return res.status(200).json({
            success: true,
            message: "Pagamento atualizado com sucesso",
            data: pagamento
        });

    } catch (error) {
        console.error("Erro ao atualizar pagamento:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== DELETAR PAGAMENTO ==========
router_pagamentos.delete("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var pagamento = await Pagamentos.findByPk(id);

        if (!pagamento) {
            return res.status(404).json({
                success: false,
                message: "Pagamento não encontrado"
            });
        }

        await pagamento.destroy();

        return res.status(200).json({
            success: true,
            message: "Pagamento deletado com sucesso"
        });

    } catch (error) {
        console.error("Erro ao deletar pagamento:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== ESTATÍSTICAS FINANCEIRAS ==========
router_pagamentos.get("/financeiro/stats", async (req, res) => {
    try {
        const totalArrecadado = await Pagamentos.sum('valor', {
            where: { status: 'pago' }
        });

        const hoje = new Date().toISOString().split('T')[0];
        const totalAtraso = await Pagamentos.sum('valor', {
            where: { 
                status: 'pendente',
                data_vencimento: { [Op.lt]: hoje }
            }
        });

        const inadimplentesList = await Pagamentos.findAll({
            where: { 
                status: 'pendente',
                data_vencimento: { [Op.lt]: hoje }
            },
            attributes: [
                'aluno', 
                'aluno_id',
                'curso',
                [sequelize.fn('SUM', sequelize.col('valor')), 'debito_total'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'qtd_pagamentos']
            ],
            group: ['aluno', 'aluno_id', 'curso'],
            order: [[sequelize.fn('SUM', sequelize.col('valor')), 'DESC']]
        });

        const totalInadimplentes = inadimplentesList.length;

        const inicioMes = new Date();
        inicioMes.setDate(1);
        const inicioMesStr = inicioMes.toISOString().split('T')[0];
        const fimMes = new Date();
        fimMes.setMonth(fimMes.getMonth() + 1);
        fimMes.setDate(0);
        const fimMesStr = fimMes.toISOString().split('T')[0];

        const previsaoMes = await Pagamentos.sum('valor', {
            where: {
                status: 'pendente',
                data_vencimento: {
                    [Op.between]: [inicioMesStr, fimMesStr]
                }
            }
        });

        const totalPago = await Pagamentos.sum('valor', {
            where: { status: 'pago' }
        });
        const totalCancelado = await Pagamentos.sum('valor', {
            where: { status: 'cancelado' }
        });
        const saldoCaixa = (totalPago || 0) - (totalCancelado || 0);

        const totalAlunos = await Matriculas.count();
        const taxaInadimplencia = totalAlunos > 0 
            ? ((totalInadimplentes / totalAlunos) * 100).toFixed(1)
            : 0;

        const meses = [];
        for (let i = 5; i >= 0; i--) {
            const data = new Date();
            data.setMonth(data.getMonth() - i);
            meses.push(data);
        }

        const graficoReceitas = await Promise.all(meses.map(async (mes) => {
            const mesStr = mes.toISOString().split('T')[0].substring(0, 7);
            const inicioMes2 = `${mesStr}-01`;
            const fimMes2 = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).toISOString().split('T')[0];

            const receita = await Pagamentos.sum('valor', {
                where: {
                    status: 'pago',
                    data_pagamento: {
                        [Op.between]: [inicioMes2, fimMes2]
                    }
                }
            });

            return {
                mes: mes.toLocaleString('pt-PT', { month: 'short' }).toUpperCase(),
                receita: receita || 0,
                previsao: Math.round((receita || 0) * 1.1)
            };
        }));

        const inadimplentesDetalhados = await Promise.all(inadimplentesList.map(async (item) => {
            const pagamentos = await Pagamentos.findAll({
                where: {
                    aluno: item.aluno,
                    status: 'pendente'
                },
                attributes: ['valor', 'data_vencimento']
            });

            const totalDebito = pagamentos.reduce((sum, p) => sum + parseFloat(p.valor), 0);
            const diasAtraso = pagamentos.reduce((max, p) => {
                if (p.data_vencimento) {
                    const vencimento = new Date(p.data_vencimento);
                    const hoje2 = new Date();
                    const diff = Math.floor((hoje2 - vencimento) / (1000 * 60 * 60 * 24));
                    return Math.max(max, diff);
                }
                return max;
            }, 0);

            return {
                id: item.aluno_id || item.id,
                nome: item.aluno,
                curso: item.curso,
                debito: totalDebito,
                dias_atraso: diasAtraso,
                qtd_pagamentos: parseInt(item.get('qtd_pagamentos'))
            };
        }));

        return res.status(200).json({
            success: true,
            data: {
                totalArrecadado: totalArrecadado || 0,
                totalAtraso: totalAtraso || 0,
                inadimplentes: totalInadimplentes,
                inadimplentesList: inadimplentesDetalhados,
                previsaoMes: previsaoMes || 0,
                saldoCaixa: saldoCaixa || 0,
                taxaInadimplencia: parseFloat(taxaInadimplencia),
                graficoReceitas: graficoReceitas
            }
        });

    } catch (error) {
        console.error("Erro ao buscar estatísticas financeiras:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== PAGAMENTOS POR ALUNO ==========
router_pagamentos.get("/aluno/:aluno", async (req, res) => {
    try {
        var { aluno } = req.params;
        var pagamentos = await Pagamentos.findAll({
            where: { 
                [Op.or]: [
                    { aluno: { [Op.like]: `%${aluno}%` } },
                    { aluno_id: aluno }
                ]
            },
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            count: pagamentos.length,
            data: pagamentos
        });

    } catch (error) {
        console.error("Erro ao buscar pagamentos por aluno:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== PAGAMENTOS POR STATUS ==========
router_pagamentos.get("/status/:status", async (req, res) => {
    try {
        var { status } = req.params;
        var pagamentos = await Pagamentos.findAll({
            where: { status: status },
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            count: pagamentos.length,
            data: pagamentos
        });

    } catch (error) {
        console.error("Erro ao buscar pagamentos por status:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

// ========== BUSCAR PAGAMENTO POR ID ==========
router_pagamentos.get("/:id", async (req, res) => {
    try {
        var { id } = req.params;
        var pagamento = await Pagamentos.findByPk(id);

        if (!pagamento) {
            return res.status(404).json({
                success: false,
                message: "Pagamento não encontrado"
            });
        }

        return res.status(200).json({
            success: true,
            data: pagamento
        });
    } catch (error) {
        console.error("Erro ao buscar pagamento:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

module.exports = router_pagamentos;