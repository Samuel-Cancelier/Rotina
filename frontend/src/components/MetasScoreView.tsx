import React, { useState } from 'react';
import { Categoria, MetaCategoria } from '../types';
import {
  Target,
  Award,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  Save,
  Layers
} from 'lucide-react';

interface MetasScoreViewProps {
  categorias: Categoria[];
  metas: MetaCategoria[];
  onUpdateCategorias: (categorias: Categoria[]) => void;
  onUpdateMetas: (metas: MetaCategoria[]) => void;
}

export const MetasScoreView: React.FC<MetasScoreViewProps> = ({
  categorias,
  metas,
  onUpdateCategorias,
  onUpdateMetas
}) => {
  const [localCategorias, setLocalCategorias] = useState<Categoria[]>(categorias);
  const [localMetas, setLocalMetas] = useState<MetaCategoria[]>(metas);
  const [salvoFeedback, setSalvoFeedback] = useState(false);

  // Soma dos pesos que contam para o score (excluindo peso 0 como Trabalho)
  const somaPesosAtivos = localCategorias.reduce((acc, c) => acc + (Number(c.peso_no_score) || 0), 0);
  const pesosValidos = somaPesosAtivos === 100;

  // Atualizar peso de uma categoria
  const handlePesoChange = (catId: string, novoPeso: number) => {
    setLocalCategorias((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, peso_no_score: Math.max(0, Math.min(100, novoPeso)) } : c))
    );
  };

  // Atualizar metas específicas (mínimo, ideal, excepcional)
  const handleMetaNivelChange = (
    catId: string,
    nivel: 'minimo' | 'ideal' | 'excepcional',
    valor: number
  ) => {
    setLocalMetas((prev) =>
      prev.map((m) => {
        if (m.categoria_id === catId) {
          return {
            ...m,
            niveis: {
              ...m.niveis,
              [nivel]: Math.max(0, valor)
            }
          };
        }
        return m;
      })
    );
  };

  // Atualizar progresso do mês
  const handleProgressoChange = (catId: string, valor: number) => {
    setLocalMetas((prev) =>
      prev.map((m) =>
        m.categoria_id === catId ? { ...m, progresso_mes_atual: Math.max(0, valor) } : m
      )
    );
  };

  // Salvar alterações
  const handleSalvarTudo = () => {
    onUpdateCategorias(localCategorias);
    onUpdateMetas(localMetas);
    setSalvoFeedback(true);
    setTimeout(() => setSalvoFeedback(false), 3000);
  };

  // Restaurar distribuição oficial padrão
  const handleRestaurarPadrao = () => {
    const distribuicaoPadrao: Record<string, number> = {
      cat_corrida: 25,
      cat_futsal: 20,
      cat_estudos: 20,
      cat_leitura: 15,
      cat_domesticas: 10,
      cat_lazer: 10,
      cat_trabalho: 0
    };

    setLocalCategorias((prev) =>
      prev.map((c) => ({
        ...c,
        peso_no_score: distribuicaoPadrao[c.id] !== undefined ? distribuicaoPadrao[c.id] : c.peso_no_score
      }))
    );
  };

  // Cálculo da pontuação por categoria com regra de 3 níveis:
  // - 0 até mínimo = proporcional (até 60%)
  // - mínimo até ideal = 100%
  // - ideal até excepcional = bônus até 120%
  const calcularScoreIndividual = (meta: MetaCategoria) => {
    const atual = meta.progresso_mes_atual;
    const { minimo, ideal, excepcional } = meta.niveis;

    if (atual <= 0) return 0;
    if (atual < minimo) return Math.round((atual / minimo) * 60);
    if (atual <= ideal) return 100;
    const extra = 100 + Math.min(20, ((atual - ideal) / Math.max(1, excepcional - ideal)) * 20);
    return Math.round(extra);
  };

  // Cálculo do Score Geral Ponderado
  let somaScoreGeral = 0;
  let somaPesosValidos = 0;
  localMetas.forEach((m) => {
    const cat = localCategorias.find((c) => c.id === m.categoria_id);
    const peso = cat?.peso_no_score || 0;
    if (peso > 0) {
      const scoreInd = calcularScoreIndividual(m);
      somaScoreGeral += scoreInd * peso;
      somaPesosValidos += peso;
    }
  });

  const scoreGeralCalculado = somaPesosValidos > 0 ? Math.round(somaScoreGeral / somaPesosValidos) : 0;

  return (
    <div className="space-y-6" id="metas-score-view-root">
      {/* Top Banner de Resumo & Status da Soma de Pesos */}
      <div className="bg-[#111] rounded-2xl border border-[#222] p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-serif italic text-white">
                Gestão de Metas & Proporção de Pesos
              </h2>
            </div>
            <p className="text-xs text-[#888] mt-1.5 max-w-xl leading-relaxed">
              Personalize o peso de cada pilar na sua rotina e configure os valores das metas
              (Mínimo, Ideal e Superação Excepcional). O pilar de <strong>Trabalho</strong> possui peso 0 para rastrear horas sem afetar seu Score de hábitos.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#161616] p-4 rounded-xl border border-[#262626]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#777] block">
                Soma dos Pesos
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-black font-mono ${
                    pesosValidos ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {somaPesosAtivos}%
                </span>
                <span className="text-xs text-[#666]">/ 100%</span>
              </div>
              {!pesosValidos && (
                <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3 h-3" /> Deve somar 100%
                </span>
              )}
            </div>

            <div className="h-10 w-px bg-[#262626]" />

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#777] block">
                Score Geral Estimado
              </span>
              <span className="text-2xl font-black font-mono text-white">
                {scoreGeralCalculado}
                <span className="text-xs font-normal text-[#777]">/100</span>
              </span>
            </div>

            <button
              id="btn-salvar-metas-pesos"
              onClick={handleSalvarTudo}
              className="ml-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {salvoFeedback ? 'Salvo!' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabela Interativa de Categorias, Pesos e Metas de 3 Níveis */}
      <div className="bg-[#0d0d0d] rounded-2xl border border-[#222] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-semibold text-white">
              Pilares Oficiais: Pesos & Níveis de Metas Mensais
            </h3>
          </div>
          <button
            onClick={handleRestaurarPadrao}
            className="text-xs text-[#888] hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181818] border border-[#2a2a2a]"
          >
            <RotateCcw className="w-3 h-3" /> Restaurar Padrão Oficial
          </button>
        </div>

        <div className="space-y-3">
          {localCategorias.map((cat) => {
            const meta = localMetas.find((m) => m.categoria_id === cat.id);
            const ehTrabalho = cat.id === 'cat_trabalho' || cat.peso_no_score === 0;
            const scoreItem = meta ? calcularScoreIndividual(meta) : 0;

            return (
              <div
                key={cat.id}
                className="bg-[#121212] border border-[#222] rounded-xl p-4 space-y-3.5 hover:border-[#333] transition-all"
              >
                {/* Linha Superior: Nome, Peso e Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: cat.cor }}
                    />
                    <div>
                      <span className="font-semibold text-white text-sm block">
                        {cat.nome}
                      </span>
                      <span className="text-[11px] text-[#777]">
                        Unidade: <strong className="text-[#aaa]">{cat.unidade_padrao}</strong>
                        {ehTrabalho && ' • Apenas informativo (não afeta Score)'}
                      </span>
                    </div>
                  </div>

                  {/* Controle de Peso */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-[#181818] px-3 py-1.5 rounded-lg border border-[#2a2a2a]">
                      <span className="text-xs text-[#888] font-mono">Peso:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={cat.peso_no_score || 0}
                        onChange={(e) => handlePesoChange(cat.id, Number(e.target.value))}
                        disabled={ehTrabalho}
                        className={`w-12 bg-transparent text-center font-mono font-bold text-sm outline-hidden ${
                          ehTrabalho ? 'text-[#666]' : 'text-amber-400'
                        }`}
                      />
                      <span className="text-xs text-[#777]">%</span>
                    </div>

                    {!ehTrabalho && (
                      <div className="text-right font-mono text-xs">
                        <span className="text-[#777]">Score: </span>
                        <span className="font-bold text-white">{scoreItem}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Linha Inferior: 3 Níveis de Metas e Progresso Atual */}
                {meta && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#1c1c1c] text-xs">
                    {/* Meta Mínima */}
                    <div className="bg-[#181818] p-2.5 rounded-lg border border-[#252525]">
                      <span className="text-[10px] text-[#777] font-mono uppercase block">
                        Mínimo (~60%)
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          value={meta.niveis.minimo}
                          onChange={(e) =>
                            handleMetaNivelChange(cat.id, 'minimo', Number(e.target.value))
                          }
                          className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 font-mono text-white text-xs outline-hidden"
                        />
                        <span className="text-[#666] text-[11px]">{cat.unidade_padrao}</span>
                      </div>
                    </div>

                    {/* Meta Ideal */}
                    <div className="bg-[#181818] p-2.5 rounded-lg border border-amber-500/20">
                      <span className="text-[10px] text-amber-400/80 font-mono uppercase block">
                        Ideal (100%)
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          value={meta.niveis.ideal}
                          onChange={(e) =>
                            handleMetaNivelChange(cat.id, 'ideal', Number(e.target.value))
                          }
                          className="w-full bg-[#111] border border-amber-500/40 rounded px-2 py-1 font-mono text-amber-300 text-xs outline-hidden"
                        />
                        <span className="text-[#666] text-[11px]">{cat.unidade_padrao}</span>
                      </div>
                    </div>

                    {/* Meta Excepcional */}
                    <div className="bg-[#181818] p-2.5 rounded-lg border border-emerald-500/20">
                      <span className="text-[10px] text-emerald-400/80 font-mono uppercase block">
                        Excepcional (120%)
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          value={meta.niveis.excepcional}
                          onChange={(e) =>
                            handleMetaNivelChange(cat.id, 'excepcional', Number(e.target.value))
                          }
                          className="w-full bg-[#111] border border-emerald-500/40 rounded px-2 py-1 font-mono text-emerald-300 text-xs outline-hidden"
                        />
                        <span className="text-[#666] text-[11px]">{cat.unidade_padrao}</span>
                      </div>
                    </div>

                    {/* Progresso Atual do Mês */}
                    <div className="bg-[#181818] p-2.5 rounded-lg border border-[#252525]">
                      <span className="text-[10px] text-blue-400/80 font-mono uppercase block">
                        Realizado no Mês
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          value={meta.progresso_mes_atual}
                          onChange={(e) => handleProgressoChange(cat.id, Number(e.target.value))}
                          className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 font-mono text-white text-xs outline-hidden"
                        />
                        <span className="text-[#666] text-[11px]">{cat.unidade_padrao}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
