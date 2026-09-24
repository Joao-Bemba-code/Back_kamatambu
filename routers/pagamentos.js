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

        // O "total em atraso"/dívida deve ser o que FALTA pagar pelo curso
        // (total do curso - valor já recebido) e não o valor que o formando
        // já pagou de forma parcial.
        const cursosAtraso = await Cursos.findAll({
            attributes: ['Nome', 'Valor_curso', 'Modulos', 'paga_mensal']
        });
        const cursosMapAtraso = {};
        const cursosMensaisSet = {};
        cursosAtraso.forEach(function (c) {
            const mensal = c.paga_mensal === 'sim';
            if (mensal) cursosMensaisSet[c.Nome] = true;
            cursosMapAtraso[c.Nome] = mensal
                ? (parseFloat(c.Valor_curso) || 0) * (parseInt(c.Modulos) || 1)
                : (parseFloat(c.Valor_curso) || 0);
        });

        // Total já recebido por formando/curso (pagamentos efectivos)
        const recebidoAtrasoRows = await Pagamentos.findAll({
            where: {
                tipo: { [Op.ne]: 'venda' },
                status: { [Op.in]: ['pago', 'parcial'] }
            },
            attributes: [
                'aluno',
                'aluno_id',
                'curso',
                [sequelize.fn('SUM', sequelize.col('valor')), 'recebido']
            ],
            group: ['aluno', 'aluno_id', 'curso']
        });
        const recebidoAtrasoMap = {};
        recebidoAtrasoRows.forEach(function (r) {
            recebidoAtrasoMap[(r.aluno || '') + '\u0000' + (r.curso || '')] = parseFloat(r.get('recebido')) || 0;
        });

        // Todo pagamento 'pendente' ou 'parcial' com valor é dinheiro que o
        // formando deve pagar, independentemente da data de vencimento.
        const inadimplentesList = await Pagamentos.findAll({
            where: {
                tipo: { [Op.ne]: 'venda' },
                status: { [Op.in]: ['pendente', 'parcial'] },
                valor: { [Op.gt]: 0 }
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

        let totalAtrasoCalc = 0;
        const inadimplentesDetalhados = await Promise.all(inadimplentesList.map(async (item) => {
            // Cursos com pagamento mensal (ex.: Inglês) têm a dívida tratada no
            // separador "Dívidas" e ficam de fora do total em atraso.
            if (cursosMensaisSet[item.curso]) {
                return null;
            }

            const pagamentos = await Pagamentos.findAll({
                where: {
                    aluno: item.aluno,
                    curso: item.curso,
                    status: ['pendente', 'parcial']
                },
                attributes: ['valor', 'data_vencimento', 'status']
            });

            const chaveAtraso = (item.aluno || '') + '\u0000' + (item.curso || '');
            const totalCursoAtraso = cursosMapAtraso[item.curso];
            const recebidoAtraso = recebidoAtrasoMap[chaveAtraso] || 0;
            // Dívida = o que FALTA pagar pelo curso (valor do curso - o que já
            // recebeu, incluindo pagamentos parciais). Nunca a soma dos parciais.
            const debitoCurso = totalCursoAtraso !== undefined
                ? Math.max(0, totalCursoAtraso - recebidoAtraso)
                : pagamentos
                    .filter(p => p.status === 'pendente')
                    .reduce((sum, p) => sum + parseFloat(p.valor), 0);

            const diasAtraso = pagamentos.reduce((max, p) => {
                if (p.data_vencimento) {
                    const vencimento = new Date(p.data_vencimento);
                    const diff = Math.floor((new Date() - vencimento) / (1000 * 60 * 60 * 24));
                    return Math.max(max, diff);
                }
                return max;
            }, 0);

            totalAtrasoCalc += debitoCurso;

            return {
                id: item.aluno_id || item.id,
                nome: item.aluno,
                curso: item.curso,
                debito: debitoCurso,
                dias_atraso: diasAtraso,
                qtd_pagamentos: parseInt(item.get('qtd_pagamentos'))
            };
        }));

        const inadimplentesValidos = inadimplentesDetalhados.filter(function (d) { return d && d.debito > 0; });
        const totalInadimplentes = inadimplentesValidos.length;

        const totalAtraso = totalAtrasoCalc;

        const inicioMes = new Date();
        inicioMes.setDate(1);
        const inicioMesStr = inicioMes.toISOString().split('T')[0];
        const fimMes = new Date();
        fimMes.setMonth(fimMes.getMonth() + 1);
        fimMes.setDate(0);
        const fimMesStr = fimMes.toISOString().split('T')[0];

        // ===== PREVISÃO DO MÊS =====
        // Soma apenas o que vence NESTE MÊS, considerando apenas turmas ATIVAS
        // (exclui concluídas, canceladas e pendentes) e formandos Inscrito/Admitido/Ativo.
        // - Cursos paga_mensal='sim': mensalidade do MÊS CORRENTE (Valor_curso)
        //   dos formandos que ainda não pagaram esse mês.
        // - Cursos paga_mensal='nao': pagamentos pendente/parcial com
        //   vencimento neste mês (o que ainda devemos receber período).
        let previsaoMesCurso = 0;
        try {
            const turmasPrevisao = await Turmas.findAll({
                where: { Status: 'Ativa' },
                attributes: ['Turma']
            });
            const nomesTurmasPrevisao = turmasPrevisao.map(t => t.Turma);

            const whereMatriculas = {
                Status: ['Inscrito', 'Admitido', 'Ativo']
            };
            if (nomesTurmasPrevisao.length > 0) {
                whereMatriculas.Turma = { [Op.in]: nomesTurmasPrevisao };
            } else {
                whereMatriculas.Turma = null;
            }

            const matriculasPrevisao = await Matriculas.findAll({ where: whereMatriculas });
            const cursos = await Cursos.findAll({
                where: { Status: 'Ativo' },
                attributes: ['Nome', 'Valor_curso', 'paga_mensal']
            });
            const cursosMapPrev = {};
            cursos.forEach(c => { cursosMapPrev[c.Nome] = c; });

            for (const m of matriculasPrevisao) {
                const curso = cursosMapPrev[m.Curso];
                if (!curso) continue;

                const whereAlunoPrev = {
                    [Op.or]: [
                        { aluno_id: m.id },
                        { aluno: m.Nome, aluno_id: null }
                    ]
                };

                if (curso.paga_mensal === 'sim') {
                    const pagoMes = await Pagamentos.findOne({
                        where: {
                            ...whereAlunoPrev,
                            tipo: 'mensalidade',
                            status: 'pago',
                            data_pagamento: {
                                [Op.between]: [inicioMesStr, fimMesStr]
                            }
                        }
                    });
                    if (!pagoMes) {
                        previsaoMesCurso += parseFloat(curso.Valor_curso) || 0;
                    }
                } else {
                    const pendenteMes = await Pagamentos.sum('valor', {
                        where: {
                            ...whereAlunoPrev,
                            status: ['pendente', 'parcial'],
                            tipo: { [Op.ne]: 'venda' },
                            data_vencimento: {
                                [Op.between]: [inicioMesStr, fimMesStr]
                            }
                        }
                    }) || 0;
                    if (pendenteMes > 0) {
                        previsaoMesCurso += parseFloat(pendenteMes);
                    }
                }
            }
        } catch (e) {
            console.warn("Erro ao calcular previsão do mês:", e.message);
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

        return res.status(200).json({
            success: true,
            data: {
                totalArrecadado: totalArrecadado || 0,
                totalDinheiro: totalDinheiro || 0,
                totalAtraso: totalAtraso || 0,
                inadimplentes: totalInadimplentes,
                inadimplentesList: inadimplentesValidos,
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
// - O valor de cada mensalidade é o Valor_curso do curso (pagamento mensal).
// - Os meses de referência vão do início da formação (data de início da turma
//   activa ou, na falta, data de matrícula) até ao mês corrente, limitados ao
//   número de modulos (meses) do curso.
// - O vencimento de cada mensalidade é no dia 5 do mês de referência; a
//   partir do dia 6 do próprio mês, a mensalidade não paga é considerada dívida.
// - Acréscimo de ACRESCIMO_ATRASO (Kz) na mensalidade não paga até ao dia 15
//   do mês de referência.
// - O valor recebido (pago/parcial) abate os meses mais antigos primeiro,
//   cobrindo pagamentos antecipados (curso pago inteiro) e parciais.
// - total_meses_divida = meses distintos em dívida (não meses x alunos).
var ACRESCIMO_ATRASO = 3000;
router_pagamentos.get("/dividas", async (req, res) => {
    try {
        var hoje = new Date();
        var diaAtual = hoje.getDate();
        var mesAtual = hoje.getMonth() + 1;
        var anoAtual = hoje.getFullYear();

        // Turmas activas (nome + data de início, usada como início da formação)
        var turmasAtivas = await Turmas.findAll({
            where: { Status: 'Ativa' },
            attributes: ['Turma', 'Data_INIC']
        });
        var nomesTurmasAtivas = turmasAtivas.map(function (t) { return t.Turma; });
        var turmaInfo = {};
        turmasAtivas.forEach(function (t) { turmaInfo[t.Turma] = t.Data_INIC; });

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

        // Apenas formandos em cursos com paga_mensal = 'sim'
        var matriculasComMensalidade = matriculas.filter(function (m) {
            return cursoInfo[m.Curso];
        });

        var dividas = await Promise.all(matriculasComMensalidade.map(async function (m) {
            var info = cursoInfo[m.Curso];
            var modulos = info ? info.Modulos : 1;
            var valorMensal = parseFloat(info.Valor_curso) || 0;

            // Meses de referência: do início da formação (início da turma activa,
            // ou data de matrícula como alternativa) até ao mês corrente
            // (inclusive), limitado ao número de modulos (meses) do curso
            var mesesRefs = [];
            var dataInicio = turmaInfo[m.Turma] ? new Date(turmaInfo[m.Turma]) : (m.Data_Matricula ? new Date(m.Data_Matricula) : new Date());
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
            // Valor recebido (pago/parcial) para abater os meses mais antigos
            var saldoRestante = 0;
            pagamentos.forEach(function (p) {
                if (p.status === 'pago' || p.status === 'parcial') {
                    saldoRestante += parseFloat(p.valor) || 0;
                }
            });

            // Dívida = meses de referência sem pagamento
            // Vencimento no dia 5 do mês de referência; a partir do dia 6 do
            // próprio mês, a mensalidade não paga é considerada dívida.
            // Acréscimo de ACRESCIMO_ATRASO se não paga até ao dia 15.
            var meses = mesesRefs.map(function (ref) {
                var venc = new Date(ref.y, ref.m - 1, 5);
                var refKey = ref.y + '-' + String(ref.m).padStart(2, '0');
                var dataVencStr = refKey + '-05';
                var pago = saldoRestante >= valorMensal;
                if (pago) saldoRestante -= valorMensal;

                var passouDia6 = (ref.y < anoAtual) ||
                    (ref.y === anoAtual && (ref.m < mesAtual || (ref.m === mesAtual && diaAtual >= 6)));
                var passouDia15 = (ref.y < anoAtual) ||
                    (ref.y === anoAtual && (ref.m < mesAtual || (ref.m === mesAtual && diaAtual >= 16)));

                var vencida = !pago && passouDia6;
                var acrescimo = (!pago && passouDia15) ? ACRESCIMO_ATRASO : 0;
                var valorMes = valorMensal + acrescimo;

                return {
                    ref_mes: refKey,
                    label: venc.toLocaleString('pt-PT', { month: 'long', year: 'numeric' }),
                    data_vencimento: dataVencStr,
                    valor: valorMes,
                    valor_base: valorMensal,
                    acrescimo: acrescimo,
                    status: pago ? 'pago' : (vencida ? 'vencida' : 'pendente'),
                    pago: pago,
                    vencida: vencida,
                    id: null
                };
            }).filter(function (mm) { return !mm.pago && mm.vencida; });

            if (!meses || meses.length === 0) return null;

            var totalDivida = meses.reduce(function (s, mm) { return s + mm.valor; }, 0);

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
        var mesesSet = {};
        data.forEach(function (d) {
            (d.meses || []).forEach(function (m) { mesesSet[m.ref_mes] = true; });
        });
        var totalMesesDivida = Object.keys(mesesSet).length;
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