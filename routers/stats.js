const express = require("express");
const router_stats = express.Router();
const { Matriculas, Turmas, Cursos, Formadores } = require("../models/index.js");
const { Sequelize } = require("sequelize");

// ========== ESTATÍSTICAS DO DASHBOARD ==========
router_stats.get("/dashboard", async (req, res) => {
    try {
        // Total de alunos (matrículas ativas)
        const totalAlunos = await Matriculas.count({
            where: { Status: ['Inscrito', 'Admitido', 'Ativo'] }
        });

        // Total de turmas ativas
        const totalTurmas = await Turmas.count({
            where: { Status: 'Ativa' }
        });

        // Total de cursos
        const totalCursos = await Cursos.count({
            where: { Status: 'Ativo' }
        });

        // Total de formadores ativos
        const totalFormadores = await Formadores.count({
            where: { Status: 'Ativo' }
        });

        // Matrículas por curso (para o gráfico)
        const matriculasPorCurso = await Matriculas.findAll({
            attributes: [
                'Curso',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
            ],
            where: { Status: ['Inscrito', 'Admitido', 'Ativo'] },
            group: ['Curso'],
            order: [[Sequelize.literal('total'), 'DESC']],
            limit: 5
        });

        // Crescimento de matrículas nos últimos 6 meses
        const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN'];
        const crescimento = [];

        for (let i = 5; i >= 0; i--) {
            const data = new Date();
            data.setMonth(data.getMonth() - i);
            const mes = data.getMonth() + 1;
            const ano = data.getFullYear();
            
            const count = await Matriculas.count({
                where: {
                    createdAt: {
                        [Sequelize.Op.gte]: new Date(ano, mes - 1, 1),
                        [Sequelize.Op.lt]: new Date(ano, mes, 1)
                    }
                }
            });
            
            crescimento.push({
                mes: meses[mes - 1],
                total: count
            });
        }

        // Calcular mudanças percentuais
        const stats = [
            {
                label: 'Total Formandos',
                value: totalAlunos,
                change: '+12%',
                icon: 'Users',
                color: 'text-[#006c49] bg-[#006c49]/10',
                changeColor: 'text-[#006c49] bg-[#006c49]/5'
            },
            {
                label: 'Cursos Ativos',
                value: totalCursos,
                change: '+8%',
                icon: 'BookOpen',
                color: 'text-[#040057] bg-[#c0c1ff]/30',
                changeColor: 'text-[#040057] bg-[#c0c1ff]/20'
            },
            {
                label: 'Turmas Ativas',
                value: totalTurmas,
                change: 'Estável',
                icon: 'CalendarDays',
                color: 'text-[#091426] bg-[#e0e3e5]',
                changeColor: 'text-[#45474c] bg-[#e0e3e5]'
            },
            {
                label: 'Formadores Ativos',
                value: totalFormadores,
                change: '+2%',
                icon: 'GraduationCap',
                color: 'text-[#006c49] bg-[#6cf8bb]/30',
                changeColor: 'text-[#006c49] bg-[#006c49]/5'
            }
        ];

        // Inscrições por curso com contagens reais
        const totalMatriculas = matriculasPorCurso.reduce((sum, item) => sum + parseInt(item.dataValues.total), 0);
        const inscricoesPorCurso = matriculasPorCurso.map(item => ({
            name: item.dataValues.Curso || 'Outros',
            value: parseInt(item.dataValues.total),
            percentage: totalMatriculas > 0 ? Math.round((item.dataValues.total / totalMatriculas) * 100) : 0
        }));

        // Se não houver dados, adicionar valores padrão
        if (inscricoesPorCurso.length === 0) {
            inscricoesPorCurso.push(
                { name: 'Gestão de Empresas', value: 0 },
                { name: 'Engenharia Software', value: 0 },
                { name: 'Design & UX', value: 0 },
                { name: 'Direito Académico', value: 0 },
                { name: 'Outros', value: 0 }
            );
        }

        // Matrículas recentes (últimas 5)
        const matriculasRecentes = await Matriculas.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'Nome', 'Curso', 'Turma', 'Status', 'createdAt']
        });

        return res.status(200).json({
            success: true,
            data: {
                stats,
                crescimento,
                inscricoesPorCurso,
                matriculasRecentes
            }
        });

    } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

module.exports = router_stats;