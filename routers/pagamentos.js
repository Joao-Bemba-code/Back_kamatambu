// routers/pagamentos.js
const express = require("express");
const router_pagamentos = express.Router();
const { Pagamentos, Matriculas, Saidas, Cursos, Turmas } = require("../models/index.js");
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

        var ehVenda = (tipo || 'mensalidade') === 'venda';

        if (!ehVenda && !aluno) {
            return res.status(400).json({
                success: false,
                message: "O nome do aluno é obrigatório"
            });
        }

        if (!ehVenda && !curso) {
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
            aluno: aluno ? aluno.trim() : null,
            aluno_id: aluno_id || null,
            curso: curso ? curso.trim() : null,
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

        var ehVendaAtualizacao = (tipo || pagamento.tipo) === 'venda';

        await pagamento.update({
            aluno: aluno ? aluno.trim() : (ehVendaAtualizacao ? null : pagamento.aluno),
            aluno_id: aluno_id || pagamento.aluno_id,
            curso: curso ? curso.trim() : (ehVendaAtualizacao ? null : pagamento.curso),
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
                tipo: { [Op.ne]: 'venda' },
                [Op.or]: [
                    { status: 'parcial' },
                    { 
                        status: 'pendente',
                        [Op.or]: [
                            { data_vencimento: { [Op.lt]: hoje } },
                            { data_vencimento: null }
                        ]
                    }
                ]
            }
        });

        const inadimplentesList = await Pagamentos.findAll({
            where: { 
                tipo: { [Op.ne]: 'venda' },
                [Op.or]: [
                    { status: 'parcial' },
                    { 
                        status: 'pendente',
                        [Op.or]: [
                            { data_vencimento: { [Op.lt]: hoje } },
                            { data_vencimento: null }
                        ]
                    }
                ]
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
                tipo: { [Op.ne]: 'venda' },
                status: ['pendente', 'parcial'],
                data_vencimento: {
                    [Op.between]: [inicioMesStr, fimMesStr]
                }
            }
        });

        let previsaoMesCurso = 0;
        try {
            const matriculasPorCurso = await Matriculas.findAll({
                attributes: [
                    'Curso',
                    [sequelize.fn('COUNT', sequelize.col('Matriculas.id')), 'total']
                ],
                where: { Status: ['Inscrito', 'Admitido', 'Ativo'] },
                group: ['Curso']
            });

            const cursoNomes = matriculasPorCurso.map(m => m.dataValues.Curso).filter(Boolean);
            if (cursoNomes.length > 0) {
                const cursos = await Cursos.findAll({
                    where: { Nome: cursoNomes, Status: 'Ativo' }
                });
                const cursosMap = {};
                cursos.forEach(c => { cursosMap[c.Nome] = parseFloat(c.Valor_curso) || 0; });

                previsaoMesCurso = matriculasPorCurso.reduce((sum, item) => {
                    const nomeCurso = item.dataValues.Curso;
                    const qtd = parseInt(item.dataValues.total);
                    const valor = cursosMap[nomeCurso] || 0;
                    return sum + (qtd * valor);
                }, 0);
            }
        } catch (e) {
            console.warn("Erro ao calcular previsão por curso:", e.message);
        }

        const totalPago = await Pagamentos.sum('valor', {
            where: { status: 'pago' }
        });
        const totalDinheiro = await Pagamentos.sum('valor', {
            where: {
                status: 'pago',
                [Op.or]: [
                    { forma_pagamento: 'dinheiro' },
                    { forma_pagamento: null },
                    { forma_pagamento: '' }
                ]
            }
        });
        const totalCancelado = await Pagamentos.sum('valor', {
            where: { status: 'cancelado' }
        });

        let totalSaidas = 0;
        try {
            totalSaidas = await Saidas.sum('valor', {
                where: { status: 'pago' }
            }) || 0;
        } catch (e) {
            console.warn("Tabela Saidas não encontrada:", e.message);
            totalSaidas = 0;
        }

        const saldoCaixa = (totalPago || 0) - (totalCancelado || 0) - totalSaidas;

        const totalAlunos = await Matriculas.count({
            where: { Status: ['Inscrito', 'Admitido', 'Ativo'] }
        });
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
                    status: ['pendente', 'parcial']
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
                totalDinheiro: totalDinheiro || 0,
                totalAtraso: totalAtraso || 0,
                inadimplentes: totalInadimplentes,
                inadimplentesList: inadimplentesDetalhados,
                previsaoMes: previsaoMesCurso || 0,
                saldoCaixa: saldoCaixa || 0,
                totalSaidas: totalSaidas,
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

// ========== DÍVIDAS POR CURSO ==========
// Lista os formandos ADMITIDOS/ATIVO cujas turmas estão activas e cujo curso
// tem paga_mensal = 'sim'. Calcula as mensalidades em aberto dinamicamente:
// - O valor de cada mês é Valor_curso / Modulos (pagamento mensal)
// - Os meses de referência vão da data de matrícula até ao mês corrente,
//   limitados ao número de modulos (meses) do curso.
// - O vencimento de cada mensalidade é no dia 5 do mês de referência, com
//   prazo de pagamento de 1 mês (até dia 5 do mês seguinte). A partir do
//   dia 6 do mês seguinte, a mensalidade não paga é considerada dívida.
router_pagamentos.get("/dividas", async (req, res) => {
    try {
        var hoje = new Date();
        var diaAtual = hoje.getDate();
        var mesAtual = hoje.getMonth() + 1;
        var anoAtual = hoje.getFullYear();

        // Turmas activas
        var turmasAtivas = await Turmas.findAll({
            where: { Status: 'Ativa' },
            attributes: ['Turma']
        });
        var nomesTurmasAtivas = turmasAtivas.map(function (t) { return t.Turma; });

        // Cursos com paga_mensal = 'sim'
        var cursos = await Cursos.findAll({
            where: { paga_mensal: 'sim' },
            attributes: ['Nome', 'Modulos', 'Valor_curso']
        });
        var cursoInfo = {};
        cursos.forEach(function (c) {
            cursoInfo[c.Nome] = {
                Modulos: parseInt(c.Modulos) || 1,
                Valor_curso: c.Valor_curso
            };
        });

        // Matrículas admitidas/ativo cujas turmas estão activas
        var whereMatriculas = {
            Status: ['Admitido', 'Ativo']
        };
        if (nomesTurmasAtivas.length > 0) {
            whereMatriculas.Turma = { [Op.in]: nomesTurmasAtivas };
        } else {
            whereMatriculas.Turma = null;
        }
        var matriculas = await Matriculas.findAll({
            where: whereMatriculas
        });

        // Apenas formandos em cursos multi-mês (Modulos > 1) com paga_mensal = 'sim'
        var matriculasComMensalidade = matriculas.filter(function (m) {
            var info = cursoInfo[m.Curso];
            return info && info.Modulos > 1;
        });

        var dividas = await Promise.all(matriculasComMensalidade.map(async function (m) {
            var info = cursoInfo[m.Curso];
            var modulos = info ? info.Modulos : 1;
            var valorMensal = (parseFloat(info.Valor_curso) || 0) / modulos;

            // Meses de referência: do mês da matrícula até ao mês corrente (inclusive),
            // limitado ao número de modulos (meses) do curso
            var mesesRefs = [];
            var dataInicio = m.Data_Matricula ? new Date(m.Data_Matricula) : new Date();
            if (isNaN(dataInicio.getTime())) dataInicio = new Date();
            var cy = dataInicio.getFullYear();
            var cm = dataInicio.getMonth() + 1;
            while ((cy < anoAtual || (cy === anoAtual && cm <= mesAtual)) && mesesRefs.length < modulos) {
                mesesRefs.push({ y: cy, m: cm });
                cm++;
                if (cm > 12) { cm = 1; cy++; }
            }

            // Pagamentos deste formando (mensalidades) -> meses já pagos
            var pagamentos = await Pagamentos.findAll({
                where: {
                    [Op.or]: [
                        { aluno_id: m.id },
                        { aluno: m.Nome, aluno_id: null }
                    ],
                    tipo: 'mensalidade'
                },
                attributes: ['id', 'data_pagamento', 'data_vencimento', 'valor', 'status']
            });
            var mesesPagos = {};
            pagamentos.forEach(function (p) {
                var fontePago = p.data_pagamento;
                var fonteVenc = p.data_vencimento;
                if (fontePago) {
                    var dp = new Date(fontePago);
                    if (!isNaN(dp.getTime())) {
                        mesesPagos[dp.getFullYear() + '-' + String(dp.getMonth() + 1).padStart(2, '0')] = true;
                    }
                }
                if (p.status === 'pago' && fonteVenc) {
                    var dv = new Date(fonteVenc);
                    if (!isNaN(dv.getTime())) {
                        mesesPagos[dv.getFullYear() + '-' + String(dv.getMonth() + 1).padStart(2, '0')] = true;
                    }
                }
            });

            // Dívida = meses de referência sem pagamento
            // Prazo de 1 mês: a mensalidade do mês X vence a 5/X e pode ser paga
            // até 5/X+1. A partir do dia 6 do mês seguinte passa a ser dívida.
            var meses = mesesRefs.map(function (ref) {
                var venc = new Date(ref.y, ref.m - 1, 1);
                var refKey = ref.y + '-' + String(ref.m).padStart(2, '0');
                var pago = !!mesesPagos[refKey];

                var seguinteAno = ref.m === 12 ? ref.y + 1 : ref.y;
                var seguinteMes = ref.m === 12 ? 1 : ref.m + 1;
                var passouPrazo = seguinteAno < anoAtual ||
                    (seguinteAno === anoAtual && (seguinteMes < mesAtual || (seguinteMes === mesAtual && diaAtual >= 6)));

                var vencida = !pago;
                if (!pago && !passouPrazo) {
                    vencida = false;
                }

                return {
                    ref_mes: refKey,
                    label: venc.toLocaleString('pt-PT', { month: 'long', year: 'numeric' }),
                    data_vencimento: venc.toISOString().split('T')[0],
                    valor: valorMensal,
                    status: pago ? 'pago' : (vencida ? 'vencida' : 'pendente'),
                    pago: pago,
                    vencida: vencida,
                    id: null
                };
            }).filter(function (mm) { return !mm.pago && mm.vencida; });

            if (!meses || meses.length === 0) return null;

            var totalDivida = meses.length * valorMensal;

            return {
                id: m.id,
                aluno: m.Nome,
                aluno_id: m.id,
                curso: m.Curso,
                turma: m.Turma,
                telefone: m.Telefone,
                modulos_curso: modulos,
                total_meses_devidos: meses.length,
                total_divida: parseFloat(totalDivida.toFixed(2)),
                meses: meses,
                pagamentos: pagamentos.map(function (p) { return p.get({ plain: true }); })
            };
        }));

        var data = dividas.filter(Boolean);

        var totalDevedores = data.length;
        var totalMesesDivida = data.reduce(function (s, d) { return s + d.total_meses_devidos; }, 0);
        var totalValorDivida = data.reduce(function (s, d) { return s + d.total_divida; }, 0);

        return res.status(200).json({
            success: true,
            total_devedores: totalDevedores,
            total_meses_divida: totalMesesDivida,
            total_valor_divida: parseFloat(totalValorDivida.toFixed(2)),
            data: data
        });
    } catch (error) {
        console.error("Erro ao buscar dívidas:", error);
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