import React, { useState } from 'react';
import { Categoria, AtividadeCadastrada, MetaCategoria, RegistroMensalCategoria } from '../types';
import {
  Calendar,
  TrendingUp,
  Award,
  BarChart3,
  Clock,
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2,
  Sparkles,
  PieChart as PieIcon,
  Flame,
  Check,
  CalendarDays
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

interface AnalyticsDashboardProps {
  categorias: Categoria[];
  atividades: AtividadeCadastrada[];
  metas: MetaCategoria[];
  registrosMensais: RegistroMensalCategoria[];
  onAddRegistroMensal?: (registro: RegistroMensalCategoria) => void;
}

export type ModoAnalise = 'semanal' | 'mensal' | 'anual';

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  categorias,
  atividades,
  metas,
  registrosMensais
}) => {
  // Modo de Análise: Semanal, Mensal ou Anual
  const [modoAnalise, setModoAnalise] = useState<ModoAnalise>('mensal');

  // Sub-filtros
  const [semanaSelecionada, setSemanaSelecionada] = useState<'atual' | 'anterior'>('atual');
  const [mesSelecionado, setMesSelecionado] = useState<number>(9); // 9 = Setembro (Mês Atual)
  const [categoriaFoco, setCategoriaFoco] = useState<string>('cat_corrida');

  // Dados mockados e consistentes para análise semanal (Dias da Semana: Seg a Dom)
  const dadosSemanaAtual = [
    { dia: 'Seg (01)', Corrida: 8, Futsal: 0, Leitura: 25, Trabalho: 8 },
    { dia: 'Ter (02)', Corrida: 0, Futsal: 1.5, Leitura: 15, Trabalho: 8.5 },
    { dia: 'Qua (03)', Corrida: 10, Futsal: 0, Leitura: 30, Trabalho: 7.5 },
    { dia: 'Qui (04)', Corrida: 0, Futsal: 0, Leitura: 20, Trabalho: 9 },
    { dia: 'Sex (05)', Corrida: 7, Futsal: 1, Leitura: 10, Trabalho: 7 },
    { dia: 'Sáb (06)', Corrida: 12, Futsal: 0, Leitura: 40, Trabalho: 2 },
    { dia: 'Dom (07)', Corrida: 0, Futsal: 2, Leitura: 25, Trabalho: 0 }
  ];

  const dadosSemanaAnterior = [
    { dia: 'Seg (25)', Corrida: 6, Futsal: 0, Leitura: 20, Trabalho: 8 },
    { dia: 'Ter (26)', Corrida: 0, Futsal: 1.5, Leitura: 15, Trabalho: 8 },
    { dia: 'Qua (27)', Corrida: 8, Futsal: 0, Leitura: 20, Trabalho: 8 },
    { dia: 'Qui (28)', Corrida: 5, Futsal: 0, Leitura: 25, Trabalho: 8.5 },
    { dia: 'Sex (29)', Corrida: 0, Futsal: 1, Leitura: 10, Trabalho: 7 },
    { dia: 'Sáb (30)', Corrida: 10, Futsal: 0, Leitura: 35, Trabalho: 0 },
    { dia: 'Dom (31)', Corrida: 0, Futsal: 2, Leitura: 30, Trabalho: 0 }
  ];

  const dadosGraficoSemanal = semanaSelecionada === 'atual' ? dadosSemanaAtual : dadosSemanaAnterior;

  // Filtragem dos registros conforme o modo de análise
  const registrosFiltrados = registrosMensais.filter((r) => {
    if (modoAnalise === 'anual') {
      return r.ano === 2026;
    }
    if (modoAnalise === 'mensal') {
      return r.ano === 2026 && r.mes === mesSelecionado;
    }
    // No modo semanal, pegamos o mês atual (Setembro) para extrair proporções da semana
    return r.ano === 2026 && r.mes === 9;
  });

  // Totais consolidados para a visualização
  const consolidadosPorCategoria = categorias.map((cat) => {
    const registrosDaCat = registrosFiltrados.filter((r) => r.categoria_id === cat.id);
    let totalPeriodo = registrosDaCat.reduce((acc, curr) => acc + curr.valor_total, 0);

    // Se for modo semanal, calculamos a fração da semana atual
    if (modoAnalise === 'semanal') {
      if (cat.id === 'cat_corrida') {
        totalPeriodo = dadosGraficoSemanal.reduce((acc, curr) => acc + curr.Corrida, 0);
      } else if (cat.id === 'cat_futsal') {
        totalPeriodo = dadosGraficoSemanal.reduce((acc, curr) => acc + curr.Futsal, 0);
      } else if (cat.id === 'cat_leitura') {
        totalPeriodo = dadosGraficoSemanal.reduce((acc, curr) => acc + curr.Leitura, 0);
      } else if (cat.id === 'cat_trabalho') {
        totalPeriodo = dadosGraficoSemanal.reduce((acc, curr) => acc + curr.Trabalho, 0);
      } else {
        totalPeriodo = Math.round(totalPeriodo / 4);
      }
    }

    // Breakdown por atividade dentro da categoria
    const breakdownAtividades: Record<string, number> = {};
    registrosDaCat.forEach((r) => {
      if (r.atividades_breakdown) {
        Object.entries(r.atividades_breakdown).forEach(([ativNome, val]) => {
          breakdownAtividades[ativNome] = (breakdownAtividades[ativNome] || 0) + (Number(val) || 0);
        });
      }
    });

    // Se for modo semanal, ajusta o breakdown
    if (modoAnalise === 'semanal' && cat.id === 'cat_corrida') {
      breakdownAtividades['Parque da Cidade'] = Math.round(totalPeriodo * 0.65);
      breakdownAtividades['Esteira da Academia'] = Math.round(totalPeriodo * 0.35);
    }

    const metaCat = metas.find((m) => m.categoria_id === cat.id);
    const metaIdeal = metaCat ? metaCat.niveis.ideal : 0;
    
    // Meta ajustada: Anual = meta * 12, Mensal = meta, Semanal = meta / 4
    let metaAjustada = metaIdeal;
    if (modoAnalise === 'anual') {
      metaAjustada = metaIdeal * 12;
    } else if (modoAnalise === 'semanal') {
      metaAjustada = Math.round(metaIdeal / 4);
    }

    const pctAtingido = metaAjustada > 0 ? Math.round((totalPeriodo / metaAjustada) * 100) : 100;

    return {
      categoria: cat,
      total: totalPeriodo,
      unidade: cat.unidade_padrao,
      metaAjustada,
      pctAtingido,
      breakdownAtividades
    };
  });

  // Cálculo do Score Geral Ponderado
  let somaScore = 0;
  let somaPesos = 0;
  consolidadosPorCategoria.forEach((item) => {
    const peso = item.categoria.peso_no_score || 0;
    if (peso > 0) {
      const scoreIndividual = Math.min(120, item.pctAtingido);
      somaScore += scoreIndividual * peso;
      somaPesos += peso;
    }
  });
  const scoreGeralPeriodo = somaPesos > 0 ? Math.round(somaScore / somaPesos) : 0;

  // Categoria em foco para exibição detalhada
  const dadosCatFoco = consolidadosPorCategoria.find((c) => c.categoria.id === categoriaFoco);

  // Totais anuais consolidados
  const totalCorridaAno = registrosMensais
    .filter((r) => r.categoria_id === 'cat_corrida')
    .reduce((acc, curr) => acc + curr.valor_total, 0);

  const totalTrabalhoAno = registrosMensais
    .filter((r) => r.categoria_id === 'cat_trabalho')
    .reduce((acc, curr) => acc + curr.valor_total, 0);

  const totalLeituraAno = registrosMensais
    .filter((r) => r.categoria_id === 'cat_leitura')
    .reduce((acc, curr) => acc + curr.valor_total, 0);

  // Dados para o gráfico mensal (Jan a Setembro)
  const dadosGraficoMensal = Array.from({ length: 9 }, (_, i) => {
    const mesIndex = i + 1;
    const ponto: Record<string, any> = {
      mes: MESES_NOMES[i].substring(0, 3)
    };

    categorias.forEach((c) => {
      const reg = registrosMensais.find((r) => r.ano === 2026 && r.mes === mesIndex && r.categoria_id === c.id);
      ponto[c.nome] = reg ? reg.valor_total : 0;
    });

    return ponto;
  });

  return (
    <div className="space-y-6" id="analytics-dashboard-root">
      {/* Barra Superior: Seletor Principal de Granularidade (Semanal, Mensal, Anual) */}
      <div className="bg-[#111] rounded-2xl border border-[#222] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 font-bold">
              Análise de Evolução & Desempenho
            </span>
          </div>
          <h2 className="text-xl font-serif italic text-white mt-1">
            {modoAnalise === 'semanal' && 'Evolução Semanal (Dias da Semana & Metas Parciais)'}
            {modoAnalise === 'mensal' && `Evolução Mensal (${MESES_NOMES[mesSelecionado - 1]} 2026)`}
            {modoAnalise === 'anual' && 'Balanço Geral Anual (Consolidado 2026 Completo)'}
          </h2>
          <p className="text-xs text-[#888] mt-0.5">
            Selecione entre a visão semanal, mensal ou anual para acompanhar seus hábitos e metas.
          </p>
        </div>

        {/* 3 BOTÕES DE SELEÇÃO: SEMANAL | MENSAL | ANUAL */}
        <div className="flex items-center p-1 bg-[#181818] border border-[#2c2c2c] rounded-xl self-start md:self-auto">
          <button
            id="btn-modo-semanal"
            onClick={() => setModoAnalise('semanal')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              modoAnalise === 'semanal'
                ? 'bg-amber-500 text-black shadow-xs'
                : 'text-[#888] hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Semanal</span>
          </button>

          <button
            id="btn-modo-mensal"
            onClick={() => setModoAnalise('mensal')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              modoAnalise === 'mensal'
                ? 'bg-amber-500 text-black shadow-xs'
                : 'text-[#888] hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Mensal</span>
          </button>

          <button
            id="btn-modo-anual"
            onClick={() => setModoAnalise('anual')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              modoAnalise === 'anual'
                ? 'bg-amber-500 text-black shadow-xs'
                : 'text-[#888] hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Anual</span>
          </button>
        </div>
      </div>

      {/* Barra de Sub-filtros Conforme o Modo Selecionado */}
      {modoAnalise === 'semanal' && (
        <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[#888] uppercase text-[10px] tracking-wider">
              Semana em Foco:
            </span>
            <div className="inline-flex gap-1.5 bg-[#161616] p-1 rounded-lg border border-[#262626]">
              <button
                onClick={() => setSemanaSelecionada('atual')}
                className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  semanaSelecionada === 'atual'
                    ? 'bg-[#252525] text-amber-300 font-semibold'
                    : 'text-[#888] hover:text-white'
                }`}
              >
                Esta Semana (01 a 07 Set)
              </button>
              <button
                onClick={() => setSemanaSelecionada('anterior')}
                className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  semanaSelecionada === 'anterior'
                    ? 'bg-[#252525] text-amber-300 font-semibold'
                    : 'text-[#888] hover:text-white'
                }`}
              >
                Semana Anterior (25 a 31 Ago)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-[#aaa]">
            <span className="flex items-center gap-1 text-emerald-400">
              <Flame className="w-3.5 h-3.5" />
              Consistência: 6/7 dias ativos
            </span>
            <span>•</span>
            <span className="text-amber-400">
              Total Corrida na Semana: {dadosGraficoSemanal.reduce((a, c) => a + c.Corrida, 0)} km
            </span>
          </div>
        </div>
      )}

      {modoAnalise === 'mensal' && (
        <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="font-mono text-[#888] uppercase text-[10px] tracking-wider shrink-0 mr-1">
              Escolha o Mês:
            </span>
            {MESES_NOMES.slice(0, 9).map((nome, idx) => {
              const mesNum = idx + 1;
              const isSelected = mesSelecionado === mesNum;
              return (
                <button
                  key={nome}
                  onClick={() => setMesSelecionado(mesNum)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                      : 'bg-[#141414] text-[#777] border border-[#242424] hover:text-white'
                  }`}
                >
                  {nome} {mesNum === 9 ? '(Atual)' : ''}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-mono text-[#888]">
            Ano Base: <strong className="text-white">2026</strong>
          </span>
        </div>
      )}

      {modoAnalise === 'anual' && (
        <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#aaa]">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Ano 2026: 9 meses registrados (Jan a Set)</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">
            ✓ Metas anuais ajustadas proporcionalmente para 12 meses
          </span>
        </div>
      )}

      {/* Cards de Métricas Rápidas do Período */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Corrida */}
        <div className="bg-[#121212] border border-[#222] rounded-2xl p-4.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#888]">
            <span className="font-mono text-[11px] uppercase tracking-wider">
              {modoAnalise === 'semanal' ? 'Corrida (Semana)' : modoAnalise === 'mensal' ? `Corrida (${MESES_NOMES[mesSelecionado - 1]})` : 'Corrida (Ano 2026)'}
            </span>
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">
              {consolidadosPorCategoria.find((c) => c.categoria.id === 'cat_corrida')?.total || 0}
            </span>
            <span className="text-sm text-red-400 font-medium">km corridos</span>
          </div>
          <p className="text-[11px] text-[#777] mt-1">
            Meta:{' '}
            <span className="text-[#ccc] font-mono">
              {consolidadosPorCategoria.find((c) => c.categoria.id === 'cat_corrida')?.metaAjustada} km
            </span>{' '}
            ({consolidadosPorCategoria.find((c) => c.categoria.id === 'cat_corrida')?.pctAtingido}%)
          </p>
        </div>

        {/* Futsal / Atividade Física */}
        <div className="bg-[#121212] border border-[#222] rounded-2xl p-4.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#888]">
            <span className="font-mono text-[11px] uppercase tracking-wider">
              {modoAnalise === 'semanal' ? 'Futsal (Semana)' : modoAnalise === 'mensal' ? `Futsal (${MESES_NOMES[mesSelecionado - 1]})` : 'Futsal (Ano 2026)'}
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">
              {consolidadosPorCategoria.find((c) => c.categoria.id === 'cat_futsal')?.total || 0}
            </span>
            <span className="text-sm text-blue-400 font-medium">horas praticadas</span>
          </div>
          <p className="text-[11px] text-[#777] mt-1">
            Meta:{' '}
            <span className="text-[#ccc] font-mono">
              {consolidadosPorCategoria.find((c) => c.categoria.id === 'cat_futsal')?.metaAjustada} h
            </span>{' '}
            ({consolidadosPorCategoria.find((c) => c.categoria.id === 'cat_futsal')?.pctAtingido}%)
          </p>
        </div>

        {/* Leitura */}
        <div className="bg-[#121212] border border-[#222] rounded-2xl p-4.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#888]">
            <span className="font-mono text-[11px] uppercase tracking-wider">
              {modoAnalise === 'semanal' ? 'Leitura (Semana)' : modoAnalise === 'mensal' ? `Leitura (${MESES_NOMES[mesSelecionado - 1]})` : 'Leitura (Ano 2026)'}
            </span>
            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">
              {consolidadosPorCategoria.find((c) => c.categoria.id === 'cat_leitura')?.total || 0}
            </span>
            <span className="text-sm text-pink-400 font-medium">páginas</span>
          </div>
          <p className="text-[11px] text-[#777] mt-1">
            Meta:{' '}
            <span className="text-[#ccc] font-mono">
              {consolidadosPorCategoria.find((c) => c.categoria.id === 'cat_leitura')?.metaAjustada} págs
            </span>{' '}
            ({consolidadosPorCategoria.find((c) => c.categoria.id === 'cat_leitura')?.pctAtingido}%)
          </p>
        </div>

        {/* Score Ponderado */}
        <div className="bg-linear-to-br from-[#1c1914] to-[#121212] border border-amber-500/35 rounded-2xl p-4.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-amber-300/80">
            <span className="font-mono text-[11px] uppercase tracking-wider">Score Ponderado</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400 font-mono">{scoreGeralPeriodo}</span>
            <span className="text-xs text-amber-200/70 font-mono">/100 pts</span>
          </div>
          <p className="text-[11px] text-[#aaa] mt-1">
            {scoreGeralPeriodo >= 90
              ? '🌟 Nível Excepcional'
              : scoreGeralPeriodo >= 75
              ? '✅ Meta Ideal Conquistada'
              : '⚡ Em Evolução Contínua'}
          </p>
        </div>
      </div>

      {/* Gráfico Principal Dinâmico (Semanal vs Mensal/Anual) */}
      <div className="bg-[#0d0d0d] border border-[#222] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-serif italic text-white">
                {modoAnalise === 'semanal' && 'Gráfico Diário da Semana (Segunda a Domingo)'}
                {modoAnalise === 'mensal' && 'Comparativo de Evolução Mês a Mês (2026)'}
                {modoAnalise === 'anual' && 'Histórico Acumulado Anual por Mês (Jan a Setembro)'}
              </h3>
            </div>
            <p className="text-xs text-[#777] mt-0.5">
              {modoAnalise === 'semanal' && 'Acompanhe a constância de cada dia da semana selecionada.'}
              {modoAnalise === 'mensal' && 'Visualize o volume de cada categoria ao longo dos meses do ano.'}
              {modoAnalise === 'anual' && 'Consolidação das principais métricas físicas e intelectuais.'}
            </p>
          </div>

          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#181818] border border-[#2a2a2a] text-amber-400 self-start sm:self-auto">
            {modoAnalise === 'semanal'
              ? `Total Semana: ${dadosGraficoSemanal.reduce((a, c) => a + c.Corrida, 0)} km corrida`
              : `Total 2026: ${totalCorridaAno} km corrida`}
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={modoAnalise === 'semanal' ? dadosGraficoSemanal : dadosGraficoMensal}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis
                dataKey={modoAnalise === 'semanal' ? 'dia' : 'mes'}
                stroke="#666"
                fontSize={11}
                tickLine={false}
              />
              <YAxis stroke="#666" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141414',
                  borderColor: '#333',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                itemStyle={{ color: '#eee' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Corrida" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Leitura" fill="#EC4899" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Futsal / Atividade Física" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Trabalho / Carreira" fill="#64748B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Metas por Categoria & Detalhamento da Atividade */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Categorias no Período */}
        <div className="lg:col-span-2 bg-[#0d0d0d] border border-[#222] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-serif italic text-white">
                Metas no Período ({modoAnalise === 'semanal' ? 'Semana' : modoAnalise === 'mensal' ? MESES_NOMES[mesSelecionado - 1] : 'Ano 2026'})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#777]">
              Clique para ver detalhes
            </span>
          </div>

          <div className="space-y-3">
            {consolidadosPorCategoria.map((item) => {
              const isSelected = item.categoria.id === categoriaFoco;
              const ehTrabalho = item.categoria.peso_no_score === 0;

              return (
                <div
                  key={item.categoria.id}
                  id={`cat-card-${item.categoria.id}`}
                  onClick={() => setCategoriaFoco(item.categoria.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#181818] border-amber-500/50 shadow-sm'
                      : 'bg-[#121212] border-[#222] hover:border-[#333]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.categoria.cor }}
                      />
                      <span className="font-semibold text-white text-sm">
                        {item.categoria.nome}
                      </span>
                      {ehTrabalho ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222] text-[#888] border border-[#333]">
                          Informativo (0% no Score)
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Peso: {item.categoria.peso_no_score}%
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-base font-bold text-white">
                        {item.total}{' '}
                        <span className="text-xs font-normal text-[#888]">{item.unidade}</span>
                      </span>
                      <span className="text-[11px] text-[#666] ml-2 font-mono">
                        (Meta: {item.metaAjustada} {item.unidade})
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="w-full bg-[#202020] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, item.pctAtingido)}%`,
                        backgroundColor: item.categoria.cor
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2 text-xs text-[#777]">
                    <span>
                      Atingimento:{' '}
                      <strong className={item.pctAtingido >= 100 ? 'text-emerald-400' : 'text-[#bbb]'}>
                        {item.pctAtingido}%
                      </strong>
                    </span>
                    <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                      Ver Atividades Específicas <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Caixa de Detalhamento por Atividade Específica (Parque vs Esteira) */}
        <div className="bg-[#0d0d0d] border border-[#222] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Divisão de Atividades
              </h3>
            </div>
            {dadosCatFoco && (
              <span
                className="text-[11px] font-mono px-2 py-0.5 rounded text-white font-medium"
                style={{
                  backgroundColor: `${dadosCatFoco.categoria.cor}33`,
                  color: dadosCatFoco.categoria.cor
                }}
              >
                {dadosCatFoco.categoria.nome}
              </span>
            )}
          </div>

          {dadosCatFoco && (
            <div className="space-y-4">
              <div className="bg-[#141414] p-3.5 rounded-xl border border-[#252525]">
                <span className="text-xs text-[#888] block">
                  Total em {dadosCatFoco.categoria.nome} ({modoAnalise}):
                </span>
                <span className="text-2xl font-black font-mono text-white mt-1 block">
                  {dadosCatFoco.total} <span className="text-xs font-normal text-[#888]">{dadosCatFoco.unidade}</span>
                </span>
              </div>

              <div>
                <span className="text-xs text-[#888] font-mono uppercase tracking-wider block mb-2.5">
                  Sub-Atividades Específicas:
                </span>

                {Object.keys(dadosCatFoco.breakdownAtividades).length === 0 ? (
                  <p className="text-xs text-[#666] italic">
                    Nenhum lançamento detalhado registrado nesta categoria para este período.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {Object.entries(dadosCatFoco.breakdownAtividades).map(([ativNome, rawQtd]) => {
                      const qtd = Number(rawQtd) || 0;
                      const pct =
                        dadosCatFoco.total > 0 ? Math.round((qtd / dadosCatFoco.total) * 100) : 0;
                      return (
                        <div key={ativNome} className="bg-[#121212] p-3 rounded-xl border border-[#222]">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-semibold text-[#eee]">{ativNome}</span>
                            <span className="font-mono text-white font-bold">
                              {qtd} {dadosCatFoco.unidade} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-[#202020] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: dadosCatFoco.categoria.cor
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dica rápida de uso no Telegram */}
              <div className="bg-[#161616] p-3 rounded-xl border border-[#282828] text-xs text-[#888] space-y-1">
                <span className="font-semibold text-amber-300 block">Dica de Comando:</span>
                <p className="text-[11px] leading-relaxed">
                  Para registrar direto pelo Telegram com a sub-atividade:
                  <code className="block mt-1 bg-black/50 p-1.5 rounded text-amber-200 font-mono text-[10px]">
                    /feito {dadosCatFoco.categoria.nome.toLowerCase().split(' ')[0]} [Atividade] [Qtd]
                  </code>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
