import React, { useState } from 'react';
import { Pilar, Categoria, RegistroMensalCategoria } from '../types';
import {
  Award,
  TrendingUp,
  Pencil,
  Check,
  Zap,
  Layers,
  Sparkles,
  BarChart3,
  HelpCircle,
  Flame, Target, X,
  ArrowRight,
  ShieldCheck
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

interface PilaresViewProps {
  pilares: Pilar[];
  categorias: Categoria[];
  registrosMensais: RegistroMensalCategoria[];
  onUpdatePilar: (pilar: Pilar) => void;
  onUpdateCategoria: (categoria: Categoria) => void;
}

export const PilaresView: React.FC<PilaresViewProps> = ({
  pilares,
  categorias,
  registrosMensais,
  onUpdatePilar,
  onUpdateCategoria
}) => {
  // Modal de Edição de Pesos & Metas
  const [modalPesosOpen, setModalPesosOpen] = useState(false);
  const [bulkPilares, setBulkPilares] = useState<Pilar[]>([]);

  // Estado para editar os pontos de uma categoria dentro do pilar
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatPontosPorUnidade, setEditCatPontosPorUnidade] = useState<number>(0);

  // Registros do mês atual (dinâmico)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const mesNomeAtual = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const mesFormatado = mesNomeAtual.charAt(0).toUpperCase() + mesNomeAtual.slice(1);

  const registrosMesAtual = registrosMensais.filter((r) => r.ano === currentYear && r.mes === currentMonth);

  // Cálculo consolidado de pontos por pilar
  const pilaresCalculados = pilares.map((pilar) => {
    const catsDoPilar = categorias.filter((c) => c.pilar_id === pilar.id);

    let totalPontosPilar = 0;
    const detalheCategorias = catsDoPilar.map((cat) => {
      const reg = registrosMesAtual.find((r) => r.categoria_id === cat.id);
      const qtdRealizada = reg ? reg.valor_total : 0;
      const pontosGerados = Number((qtdRealizada * cat.pontos_por_unidade).toFixed(1));
      totalPontosPilar += pontosGerados;

      return {
        categoria: cat,
        qtdRealizada,
        pontosGerados
      };
    });

    totalPontosPilar = Number(totalPontosPilar.toFixed(1));
    const metaPontos = pilar.meta_pontos_mensal;
    const pctAtingido =
      pilar.tem_meta && metaPontos > 0
        ? Math.round((totalPontosPilar / metaPontos) * 100)
        : 100;

    return {
      pilar,
      totalPontosPilar,
      metaPontos,
      pctAtingido,
      detalheCategorias
    };
  });

  // Cálculo do Score Geral Ponderado (baseado nos Pilares Soberanos com meta)
  let somaScore = 0;
  let somaPesos = 0;
  pilaresCalculados.forEach(({ pilar, pctAtingido }) => {
    if (pilar.tem_meta && pilar.peso_no_score_geral > 0) {
      somaScore += pctAtingido * pilar.peso_no_score_geral;
      somaPesos += pilar.peso_no_score_geral;
    }
  });
  const scoreGeralPonderado = somaPesos > 0 ? Math.round(somaScore / somaPesos) : 0;

  // Handlers para bulk edit de Pilares
  const openBulkEdit = () => {
    setBulkPilares([...pilares]);
    setModalPesosOpen(true);
  };

  const handleBulkChange = (id: string, field: 'meta_pontos_mensal' | 'peso_no_score_geral' | 'tem_meta', value: number | boolean) => {
    setBulkPilares(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleBulkSave = () => {
    bulkPilares.forEach(p => onUpdatePilar(p));
    setModalPesosOpen(false);
  };

  const handleStartEditCat = (cat: Categoria) => {
    setEditingCatId(cat.id);
    setEditCatPontosPorUnidade(cat.pontos_por_unidade);
  };

  const handleSaveCat = (cat: Categoria) => {
    onUpdateCategoria({
      ...cat,
      pontos_por_unidade: Number(editCatPontosPorUnidade) || 0
    });
    setEditingCatId(null);
  };

  // Dados para o Gráfico de Pontos por Pilar
  const dadosGraficoPilares = pilaresCalculados
    .filter((p) => p.pilar.tem_meta)
    .map((p) => ({
      nome: p.pilar.nome,
      'Pontos Realizados': p.totalPontosPilar,
      'Meta de Pontos': p.metaPontos
    }));

  return (
    <div className="space-y-6" id="pilares-view-root">
      {/* Banner Principal de Conceito dos Pilares Soberanos */}
      <div className="bg-[#111] rounded-2xl border border-[#222] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 font-bold">
              Nível 1 • Os Pilares Soberanos
            </span>
          </div>
          <h2 className="text-xl font-serif italic text-white mt-1">
            Gestão Ponderada de Metas & Score Geral
          </h2>
          <p className="text-xs text-[#888] mt-0.5 max-w-2xl">
            O Score Geral é a média percentual do atingimento de cada pilar em relação ao seu peso (%). Os pontos atuam internamente. Você pode extrapolar os 100% caso deseje recompensar superação na sua rotina.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button
            onClick={openBulkEdit}
            className="px-4 py-2 bg-[#222] border border-[#333] hover:border-amber-500/50 hover:bg-[#2a2a2a] transition-all rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            Configurar Pesos & Metas
          </button>
          {/* Card do Score Geral Ponderado */}
          <div className="bg-linear-to-br from-[#1a1610] to-[#121212] border border-amber-500/40 rounded-xl p-4 flex items-center gap-4 shrink-0 shadow-xs">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300/80 block">
                Score Geral Ponderado
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-black text-amber-400 font-mono">
                  {scoreGeralPonderado}
                </span>
                <span className="text-xs font-mono text-amber-200/70">%</span>
              </div>
              <span className="text-[10px] text-[#888] font-mono block mt-0.5">
                Soma dos Pesos: {somaPesos}%
              </span>
            </div>
            <Award className="w-8 h-8 text-amber-400/80" />
          </div>
        </div>
      </div>

      {/* Gráfico Comparativo de Pontos dos Pilares */}
      <div className="bg-[#0d0d0d] border border-[#222] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-serif italic text-white">
              Pontuação Conquistada vs Meta Mensal em Pontos ({mesFormatado} {currentYear})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#888]">
            Escala Unificada em Pontos
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGraficoPilares} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="nome" stroke="#777" fontSize={11} tickLine={false} />
              <YAxis stroke="#777" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141414',
                  borderColor: '#333',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                itemStyle={{ color: '#eee' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Pontos Realizados" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Meta de Pontos" fill="#333" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lista dos 5 Pilares Oficiais */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[#888]">
          <span className="font-mono uppercase tracking-wider">
            Detalhamento dos 5 Pilares Soberanos
          </span>
          <span className="text-[#666] font-mono">
            Clique em "Configurar Pesos & Metas" para calibrar
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {pilaresCalculados.map(({ pilar, totalPontosPilar, metaPontos, pctAtingido, detalheCategorias }) => {

            return (
              <div
                key={pilar.id}
                id={`card-pilar-${pilar.id}`}
                className="bg-[#121212] border border-[#222] rounded-2xl p-5 space-y-4 transition-all hover:border-[#2e2e2e]"
              >
                {/* Topo do Pilar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-sm text-black shrink-0"
                      style={{ backgroundColor: pilar.cor }}
                    >
                      {pilar.numero}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-lg">
                          {pilar.nome}
                        </h3>
                        {pilar.tem_meta ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25">
                            Peso no Score: {pilar.peso_no_score_geral}%
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#202020] text-[#888] border border-[#333]">
                            Registro Livre (Sem Meta)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#777] mt-0.5">
                        {pilar.descricao}
                      </p>
                    </div>
                  </div>

                  {/* Ações de Edição do Pilar */}
                  {pilar.tem_meta && (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181818] border border-[#2a2a2a] rounded-lg text-xs font-medium text-[#aaa]">
                        <Target className="w-3.5 h-3.5 text-amber-500/70" />
                        Meta: {pilar.meta_pontos_mensal} pts | Peso: {pilar.peso_no_score_geral}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Barra de Progresso em Pontos */}
                {pilar.tem_meta && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-[#aaa] flex items-center gap-1.5 font-mono">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        Total Conquistado:{' '}
                        <strong className="text-white text-sm">
                          {totalPontosPilar} pontos
                        </strong>
                      </span>
                      <span className="font-mono text-[#888]">
                        Meta do Pilar: <strong className="text-amber-300">{metaPontos} pontos</strong>{' '}
                        ({pctAtingido}%)
                      </span>
                    </div>

                    <div className="w-full bg-[#1e1e1e] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, pctAtingido)}%`,
                          backgroundColor: pilar.cor
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Tabela de Categorias que alimentam este Pilar */}
                <div className="pt-2 border-t border-[#1c1c1c]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-[#777] uppercase tracking-wider">
                      Categorias Integrantes & Equivalência de Pontos:
                    </span>
                    <span className="text-[10px] font-mono text-[#666]">
                      Você pode ajustar os pontos por unidade de cada categoria
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {detalheCategorias.map(({ categoria, qtdRealizada, pontosGerados }) => {
                      const isEditingCat = editingCatId === categoria.id;

                      return (
                        <div
                          key={categoria.id}
                          className="bg-[#161616] p-3.5 rounded-xl border border-[#222] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: categoria.cor }}
                              />
                              <span className="font-semibold text-white text-sm">
                                {categoria.nome}
                              </span>
                            </div>

                            {/* Editar pontos da categoria */}
                            {isEditingCat ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={editCatPontosPorUnidade}
                                  onChange={(e) => setEditCatPontosPorUnidade(Number(e.target.value))}
                                  className="w-14 bg-[#111] border border-[#333] text-white px-1 py-0.5 rounded text-xs font-mono"
                                />
                                <button
                                  onClick={() => handleSaveCat(categoria)}
                                  className="p-1 rounded bg-amber-500 text-black text-xs cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartEditCat(categoria)}
                                className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-0.5 cursor-pointer"
                                title="Alterar quantos pontos 1 unidade vale"
                              >
                                <span>{categoria.pontos_por_unidade} pts/{categoria.unidade_padrao}</span>
                                <Pencil className="w-2.5 h-2.5 ml-0.5" />
                              </button>
                            )}
                          </div>

                          <div className="flex items-baseline justify-between text-xs pt-1 border-t border-[#202020]">
                            <span className="text-[#888]">
                              {qtdRealizada} {categoria.unidade_padrao} feitos
                            </span>
                            <span className="font-mono font-bold text-amber-400 text-sm">
                              +{pontosGerados} pts
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Gestão de Pesos & Metas */}
      {modalPesosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#222] flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                Gestão de Metas & Proporção de Pesos
              </h3>
              <button 
                onClick={() => setModalPesosOpen(false)}
                className="text-[#888] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <p className="text-xs text-[#aaa] mb-4">
                Personalize o peso de cada pilar na sua rotina e configure os valores das metas em Pontos. 
                Pilares sem meta (como Trabalho) não somam pontos no Score Geral. A soma dos pesos dos pilares ATIVOS deve ser exatos 100%.
              </p>

              {bulkPilares.map((pilar) => (
                <div key={pilar.id} className="bg-[#181818] border border-[#222] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pilar.cor }} />
                      <h4 className="font-bold text-white">{pilar.nome}</h4>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-[#888] cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={pilar.tem_meta}
                          onChange={(e) => handleBulkChange(pilar.id, 'tem_meta', e.target.checked)}
                          className="rounded border-[#444] bg-[#222] text-amber-500 focus:ring-amber-500/20"
                        />
                        Incluir no Score Geral (Ter meta)
                      </label>
                    </div>
                  </div>

                  <div className={`flex items-center gap-4 ${!pilar.tem_meta ? 'opacity-30 pointer-events-none' : ''}`}>
                    <div>
                      <label className="text-[10px] font-mono text-[#666] block mb-1">Meta de Pontos</label>
                      <input 
                        type="number"
                        value={pilar.meta_pontos_mensal}
                        onChange={(e) => handleBulkChange(pilar.id, 'meta_pontos_mensal', Number(e.target.value))}
                        className="w-24 bg-[#111] border border-[#333] text-white px-3 py-1.5 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#666] block mb-1">Peso no Score (%)</label>
                      <input 
                        type="number"
                        value={pilar.peso_no_score_geral}
                        onChange={(e) => handleBulkChange(pilar.id, 'peso_no_score_geral', Number(e.target.value))}
                        className="w-20 bg-[#111] border border-[#333] text-amber-400 px-3 py-1.5 rounded-lg text-sm font-bold font-mono text-center"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-[#222] bg-[#0a0a0a] rounded-b-2xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#888]">Soma dos Pesos:</span>
                <span className={`text-lg font-bold font-mono ${
                  bulkPilares.filter(p => p.tem_meta).reduce((acc, p) => acc + p.peso_no_score_geral, 0) === 100 
                    ? 'text-emerald-400' 
                    : 'text-rose-400'
                }`}>
                  {bulkPilares.filter(p => p.tem_meta).reduce((acc, p) => acc + p.peso_no_score_geral, 0)}%
                </span>
              </div>
              
              <button
                onClick={handleBulkSave}
                disabled={bulkPilares.filter(p => p.tem_meta).reduce((acc, p) => acc + p.peso_no_score_geral, 0) !== 100}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:bg-[#333] disabled:text-[#888] disabled:cursor-not-allowed text-black font-bold rounded-xl text-sm transition-all cursor-pointer"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
