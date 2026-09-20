import React, { useState } from 'react';
import { Pilar, Categoria, RegistroMensalCategoria, PilarId } from '../types';
import { CORES_PILARES } from '../data/initialData';
import {
  Layers,
  BarChart3,
  ArrowUpDown,
  Plus,
  Pencil,
  Check,
  X,
  Sparkles,
  TrendingUp,
  Target,
  ArrowUp,
  ArrowDown,
  Trash2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';

interface CategoriasViewProps {
  pilares: Pilar[];
  categorias: Categoria[];
  registrosMensais: RegistroMensalCategoria[];
  onUpdateCategoria: (categoria: Categoria) => void;
  onAddCategoria: (categoria: Categoria) => void;
  onDeleteCategoria?: (id: string) => void;
}

export type CategoriaSortMode = 'maior_atingimento' | 'menor_atingimento' | 'nome' | 'pilar';

export const CategoriasView: React.FC<CategoriasViewProps> = ({
  pilares,
  categorias,
  registrosMensais,
  onUpdateCategoria,
  onAddCategoria,
  onDeleteCategoria
}) => {
  // Ordenação
  const [sortMode, setSortMode] = useState<CategoriaSortMode>('maior_atingimento');

  // Filtro de Pilar opcional
  const [filtroPilar, setFiltroPilar] = useState<string>('todos');

  // Estado de Edição
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState<string>('');
  const [editMetaMensal, setEditMetaMensal] = useState<number>(0);
  const [editPontosPorUnidade, setEditPontosPorUnidade] = useState<number>(0);
  const [editUnidadePadrao, setEditUnidadePadrao] = useState<string>('');
  const [editInativa, setEditInativa] = useState<boolean>(false);

  // Modal para Nova Categoria
  const [modalNovaCatOpen, setModalNovaCatOpen] = useState<boolean>(false);
  const [novoNome, setNovoNome] = useState<string>('');
  const [novoPilarId, setNovoPilarId] = useState<string>('pilar_atividade_fisica');
  const [novaUnidade, setNovaUnidade] = useState<string>('km');
  const [novaMetaMensal, setNovaMetaMensal] = useState<number>(20);
  const [novosPontosPorUnidade, setNovosPontosPorUnidade] = useState<number>(3);

  // Pilar selecionado e cor obrigatória herdada (não muda)
  const pilarSelecionado = pilares.find((p) => p.id === novoPilarId);
  const corDoPilarSelecionado = pilarSelecionado?.cor || CORES_PILARES[novoPilarId as PilarId] || '#10b981';

  // Registros do mês atual (dinâmico)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const registrosMesAtual = registrosMensais.filter((r) => r.ano === currentYear && r.mes === currentMonth);

  // Calcular progresso quantitativo de cada categoria com cor estritamente herdada do Pilar
  const categoriasComProgresso = categorias.map((cat) => {
    const reg = registrosMesAtual.find((r) => r.categoria_id === cat.id);
    const realizado = reg ? reg.valor_total : 0;
    const meta = cat.meta_mensal || 0;
    const pctAtingido = meta > 0 ? Math.round((realizado / meta) * 100) : (realizado > 0 ? 100 : 0);
    const pontosGerados = Number((realizado * cat.pontos_por_unidade).toFixed(1));
    const pilar = pilares.find((p) => p.id === cat.pilar_id);
    const pilarCor = pilar?.cor || CORES_PILARES[cat.pilar_id as PilarId] || '#10b981';

    return {
      ...cat,
      cor: pilarCor, // Cor da categoria é estritamente a mesma do pilar setada no script (não muda)
      realizado,
      meta,
      pctAtingido,
      pontosGerados,
      pilarNome: pilar ? pilar.nome : 'Sem Pilar',
      pilarCor
    };
  });

  // Filtro
  const categoriasFiltradas = categoriasComProgresso.filter((cat) => {
    if (filtroPilar === 'todos') return true;
    return cat.pilar_id === filtroPilar;
  });

  // Ordenação
  const categoriasOrdenadas = [...categoriasFiltradas].sort((a, b) => {
    if (sortMode === 'maior_atingimento') {
      return b.pctAtingido - a.pctAtingido;
    }
    if (sortMode === 'menor_atingimento') {
      return a.pctAtingido - b.pctAtingido;
    }
    if (sortMode === 'nome') {
      return a.nome.localeCompare(b.nome);
    }
    if (sortMode === 'pilar') {
      return a.pilarNome.localeCompare(b.pilarNome);
    }
    return 0;
  });

  // Salvar Edição
  const handleStartEdit = (cat: typeof categoriasComProgresso[0]) => {
    setEditingCatId(cat.id);
    setEditNome(cat.nome);
    setEditMetaMensal(cat.meta_mensal);
    setEditPontosPorUnidade(cat.pontos_por_unidade);
    setEditUnidadePadrao(cat.unidade_padrao);
    setEditInativa(cat.inativa || false);
  };

  const handleSaveEdit = (cat: Categoria) => {
    onUpdateCategoria({
      ...cat,
      nome: editNome.trim() || cat.nome,
      unidade_padrao: editUnidadePadrao.trim() || cat.unidade_padrao,
      meta_mensal: Number(editMetaMensal) || 0,
      pontos_por_unidade: Number(editPontosPorUnidade) || 0,
      inativa: editInativa
    });
    setEditingCatId(null);
  };

  // Cadastrar Nova Categoria
  const handleCriarCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;

    const newId = `cat_${novoNome.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}`;
    const novaCat: Categoria = {
      id: newId,
      pilar_id: novoPilarId as any,
      nome: novoNome.trim(),
      unidade_padrao: novaUnidade.trim() || 'unidades',
      meta_mensal: Number(novaMetaMensal) || 0,
      pontos_por_unidade: Number(novosPontosPorUnidade) || 0,
      cor: corDoPilarSelecionado,
      criado_em: new Date().toISOString().split('T')[0]
    };

    onAddCategoria(novaCat);
    setNovoNome('');
    setModalNovaCatOpen(false);
  };

  // Dados para o Gráfico de Barras Comparativo
  const dadosGraficoCategorias = categoriasOrdenadas
    .filter((c) => c.meta > 0)
    .map((c) => ({
      nome: c.nome,
      '% Atingido da Meta': c.pctAtingido,
      cor: c.cor,
      label: `${c.realizado}/${c.meta} ${c.unidade_padrao}`
    }));

  return (
    <div className="space-y-6" id="categorias-view-root">
      {/* Top Header */}
      <div className="bg-[#111] rounded-2xl border border-[#222] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-bold">
              Nível 2 • Categorias Quantitativas
            </span>
          </div>
          <h2 className="text-xl font-serif italic text-white mt-1">
            Análise Individual por Categorias & Metas Puras
          </h2>
          <p className="text-xs text-[#888] mt-0.5 max-w-2xl">
            Aqui você compara diretamente o realizado em cada hábito em suas unidades reais (km, páginas, horas).
            As categorias não possuem peso no Score Geral; possuem apenas sua meta mensal que você mesmo define.
          </p>
        </div>

        <button
          onClick={() => setModalNovaCatOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Barra de Controles: Ordenação & Filtro por Pilar */}
      <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Ordenação */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#888] uppercase text-[10px] tracking-wider flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-amber-400" />
            Ordenar por:
          </span>
          <div className="inline-flex gap-1 bg-[#161616] p-1 rounded-lg border border-[#262626]">
            <button
              onClick={() => setSortMode('maior_atingimento')}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                sortMode === 'maior_atingimento'
                  ? 'bg-[#252525] text-amber-300 font-semibold'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              <ArrowUp className="w-3 h-3 text-emerald-400" />
              <span>Maior % de Meta</span>
            </button>
            <button
              onClick={() => setSortMode('menor_atingimento')}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                sortMode === 'menor_atingimento'
                  ? 'bg-[#252525] text-amber-300 font-semibold'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              <ArrowDown className="w-3 h-3 text-rose-400" />
              <span>Menor % de Meta</span>
            </button>
            <button
              onClick={() => setSortMode('pilar')}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                sortMode === 'pilar'
                  ? 'bg-[#252525] text-amber-300 font-semibold'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              Pilar Soberano
            </button>
            <button
              onClick={() => setSortMode('nome')}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                sortMode === 'nome'
                  ? 'bg-[#252525] text-amber-300 font-semibold'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              A-Z
            </button>
          </div>
        </div>

        {/* Filtro por Pilar */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#888] uppercase text-[10px] tracking-wider">
            Filtrar Pilar:
          </span>
          <select
            value={filtroPilar}
            onChange={(e) => setFiltroPilar(e.target.value)}
            className="bg-[#161616] border border-[#2a2a2a] text-white text-xs px-2.5 py-1 rounded-lg focus:outline-hidden focus:border-amber-500 font-mono"
          >
            <option value="todos">Todos os Pilares ({categorias.length})</option>
            {pilares.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Gráfico Comparativo de Alcance de Metas (% das Categorias) */}
      <div className="bg-[#0d0d0d] border border-[#222] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="text-base font-serif italic text-white">
              Comparativo de Alcance de Meta por Categoria (% da Meta Mensal Cumprida)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#888]">
            Ordenado por {sortMode === 'maior_atingimento' ? 'Maior Atingimento' : sortMode === 'menor_atingimento' ? 'Menor Atingimento' : 'Pilar / Nome'}
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGraficoCategorias} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="nome" stroke="#777" fontSize={11} tickLine={false} />
              <YAxis stroke="#777" fontSize={11} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141414',
                  borderColor: '#333',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: any, name: any, item: any) => [
                  `${value}% (${item.payload.label})`,
                  'Alcance da Meta'
                ]}
              />
              <Bar dataKey="% Atingido da Meta" radius={[4, 4, 0, 0]}>
                {dadosGraficoCategorias.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cards das Categorias em Grade */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoriasOrdenadas.map((cat) => {
          const isEditing = editingCatId === cat.id;

          return (
            <div
              key={cat.id}
              id={`card-cat-${cat.id}`}
              className={`bg-[#121212] border border-[#222] rounded-2xl p-5 space-y-3.5 transition-all hover:border-[#333] ${cat.inativa ? 'opacity-50 grayscale' : ''}`}
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.cor }}
                    />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="font-bold text-white text-base bg-[#111] border border-[#333] px-2 py-0.5 rounded w-full"
                      />
                    ) : (
                      <h4 className="font-bold text-white text-base flex items-center gap-2">
                        {cat.nome}
                        {cat.inativa && <span className="text-[10px] bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded border border-red-900/50">Inativa</span>}
                      </h4>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[#777] block mt-1">
                    Pilar: <strong style={{ color: cat.pilarCor }}>{cat.pilarNome}</strong>
                  </span>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleSaveEdit(cat)}
                      className="p-1.5 rounded-lg bg-amber-500 text-black text-xs font-bold cursor-pointer hover:bg-amber-400"
                      title="Salvar Alterações"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteCategoria && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja excluir a categoria "${cat.nome}"?`)) {
                            onDeleteCategoria(cat.id);
                            setEditingCatId(null);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 text-xs cursor-pointer border border-red-900/40"
                        title="Excluir Categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingCatId(null)}
                      className="p-1.5 rounded-lg bg-[#222] text-[#888] text-xs cursor-pointer hover:text-white"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStartEdit(cat)}
                      className="p-1.5 rounded-lg bg-[#181818] hover:bg-[#222] text-[#888] hover:text-amber-400 border border-[#2a2a2a] text-xs transition-colors cursor-pointer shrink-0"
                      title="Editar Categoria"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    {onDeleteCategoria && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja excluir a categoria "${cat.nome}"?`)) {
                            onDeleteCategoria(cat.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-[#181818] hover:bg-red-950/30 text-[#666] hover:text-red-400 border border-[#2a2a2a] hover:border-red-900/50 text-xs transition-colors cursor-pointer shrink-0"
                        title="Excluir Categoria"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Informações Numéricas e Edição */}
              {isEditing ? (
                <div className="bg-[#181818] p-3 rounded-xl border border-amber-500/40 space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-mono text-[#888] block mb-0.5">
                      Unidade de Medida:
                    </label>
                    <input
                      type="text"
                      value={editUnidadePadrao}
                      onChange={(e) => setEditUnidadePadrao(e.target.value)}
                      className="w-full bg-[#111] border border-[#333] text-white px-2 py-1 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#888] block mb-0.5">
                      Meta Mensal ({editUnidadePadrao}):
                    </label>
                    <input
                      type="number"
                      value={editMetaMensal}
                      onChange={(e) => setEditMetaMensal(Number(e.target.value))}
                      className="w-full bg-[#111] border border-[#333] text-white px-2 py-1 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#888] block mb-0.5">
                      Pontos gerados por 1 {editUnidadePadrao}:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={editPontosPorUnidade}
                      onChange={(e) => setEditPontosPorUnidade(Number(e.target.value))}
                      className="w-full bg-[#111] border border-[#333] text-white px-2 py-1 rounded text-xs font-mono"
                    />
                  </div>
                  <div className="pt-2 border-t border-[#333] flex items-center justify-between">
                    <span className="text-[#888] font-mono">Status da Categoria</span>
                    <button
                      onClick={() => setEditInativa(!editInativa)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                        editInativa 
                          ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}
                    >
                      {editInativa ? 'Inativa' : 'Ativa'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black font-mono text-white">
                        {cat.realizado}
                      </span>
                      <span className="text-xs font-normal text-[#888] ml-1">
                        / {cat.meta > 0 ? `${cat.meta} ${cat.unidade_padrao}` : `livre`}
                      </span>
                    </div>

                    <span
                      className={`text-sm font-mono font-bold ${
                        cat.pctAtingido >= 100
                          ? 'text-emerald-400'
                          : cat.pctAtingido >= 60
                          ? 'text-amber-400'
                          : 'text-[#aaa]'
                      }`}
                    >
                      {cat.pctAtingido}%
                    </span>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="w-full bg-[#1e1e1e] h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, cat.pctAtingido)}%`,
                        backgroundColor: cat.cor
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#777] font-mono mt-2">
                    <span>
                      1 {cat.unidade_padrao} = {cat.pontos_por_unidade} pts no Pilar
                    </span>
                    <span className="text-amber-400 font-bold">
                      +{cat.pontosGerados} pts
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Cadastrar Nova Categoria */}
      {modalNovaCatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#121212] border border-[#333] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  Nova Categoria de Hábito
                </h3>
              </div>
              <button
                onClick={() => setModalNovaCatOpen(false)}
                className="text-[#777] hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCriarCategoria} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs text-[#aaa] font-medium mb-1">
                  1. Selecione o Pilar Soberano:
                </label>
                <select
                  value={novoPilarId}
                  onChange={(e) => setNovoPilarId(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] text-white p-2 rounded-lg font-medium"
                >
                  {pilares.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.numero} - {p.nome} ({p.tem_meta ? `Meta: ${p.meta_pontos_mensal} pts` : 'Sem Meta'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#aaa] font-medium mb-1">
                  2. Nome da Categoria (ex: Natação, Jiu-Jitsu, Podcasts):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Natação"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] text-white p-2 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#aaa] font-medium mb-1">
                    Unidade de Medida:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="km, horas, páginas"
                    value={novaUnidade}
                    onChange={(e) => setNovaUnidade(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] text-white p-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#aaa] font-medium mb-1">
                    Meta Mensal Pura:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={novaMetaMensal}
                    onChange={(e) => setNovaMetaMensal(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-[#333] text-white p-2 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#aaa] font-medium mb-1">
                  3. Quantos pontos 1 {novaUnidade || 'unidade'} vale no Pilar?
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={novosPontosPorUnidade}
                  onChange={(e) => setNovosPontosPorUnidade(Number(e.target.value))}
                  className="w-full bg-[#181818] border border-[#333] text-white p-2 rounded-lg font-mono"
                />
                <span className="text-[10px] text-[#777] block mt-1">
                  Ex: Se for 3 pts/km, correr 20 km gera 60 pontos para o pilar de Atividade Física.
                </span>
              </div>

              <div>
                <label className="block text-xs text-[#aaa] font-medium mb-1">
                  Cor da Categoria (Fixa pelo Pilar Soberano):
                </label>
                <div className="flex items-center gap-3 bg-[#181818] border border-[#2a2a2a] p-2.5 rounded-lg">
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-xs ring-2 ring-white/10"
                    style={{ backgroundColor: corDoPilarSelecionado }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-white font-semibold flex items-center gap-1.5">
                      {pilarSelecionado?.nome || 'Pilar'} • {corDoPilarSelecionado}
                    </span>
                    <span className="text-[10px] text-[#777]">
                      As cores das categorias são as mesmas do pilar já setadas no script (não mudam).
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setModalNovaCatOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#202020] hover:bg-[#2a2a2a] text-[#aaa] text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Cadastrar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
