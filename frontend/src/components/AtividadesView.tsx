import React, { useState } from 'react';
import { ListTodo, Plus, Search, Layers, ShieldCheck, ChevronRight, CheckCircle2, Bot, Trash2, Edit2, X } from 'lucide-react';
import { AtividadeCadastrada, Categoria, Pilar } from '../types';
import { CORES_PILARES } from '../data/initialData';

interface AtividadesViewProps {
  atividades: AtividadeCadastrada[];
  categorias: Categoria[];
  pilares: Pilar[];
  onAddAtividade: (ativ: Omit<AtividadeCadastrada, 'id'>) => void;
  onUpdateAtividade: (ativ: AtividadeCadastrada) => void;
  onDeleteAtividade: (id: string) => void;
}

export const AtividadesView: React.FC<AtividadesViewProps> = ({
  atividades,
  categorias,
  pilares,
  onAddAtividade,
  onUpdateAtividade,
  onDeleteAtividade
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAtiv, setEditingAtiv] = useState<AtividadeCadastrada | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [catId, setCatId] = useState('');
  const [recorrente, setRecorrente] = useState(true);
  const [unidade, setUnidade] = useState('');
  const [afetaMeta, setAfetaMeta] = useState(true);

  const filteredAtividades = atividades.filter((ativ) => {
    const matchesSearch = ativ.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategoria === 'todas' || ativ.categoria_id === selectedCategoria;
    return matchesSearch && matchesCat;
  });

  const openModalNew = () => {
    setEditingAtiv(null);
    setNome('');
    setCatId(categorias[0]?.id || '');
    setRecorrente(true);
    setUnidade('');
    setAfetaMeta(true);
    setModalOpen(true);
  };

  const openModalEdit = (ativ: AtividadeCadastrada) => {
    setEditingAtiv(ativ);
    setNome(ativ.nome);
    setCatId(ativ.categoria_id);
    setRecorrente(ativ.recorrente ?? true);
    setUnidade(ativ.unidade || '');
    setAfetaMeta(ativ.afeta_meta ?? true);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!nome.trim() || !catId) return;
    
    const cat = categorias.find((c) => c.id === catId);
    
    if (editingAtiv) {
      onUpdateAtividade({
        ...editingAtiv,
        nome: nome.trim(),
        categoria_id: catId,
        categoria_nome: cat?.nome || 'Geral',
        pilar_id: cat?.pilar_id,
        recorrente,
        unidade: unidade.trim() || cat?.unidade_padrao || 'un',
        afeta_meta: afetaMeta
      });
    } else {
      onAddAtividade({
        nome: nome.trim(),
        categoria_id: catId,
        categoria_nome: cat?.nome || 'Geral',
        pilar_id: cat?.pilar_id,
        recorrente,
        unidade: unidade.trim() || cat?.unidade_padrao || 'un',
        afeta_meta: afetaMeta
      });
    }
    
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#111] rounded-2xl border border-[#222] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
              Nível 3 • Atividades Direcionadas
            </span>
          </div>
          <h2 className="text-xl font-serif italic text-white mt-1">
            Repositório de Hábitos & Tarefas
          </h2>
          <p className="text-xs text-[#888] mt-0.5 max-w-2xl">
            Atividades são os hábitos específicos que você realiza no dia a dia. Elas não possuem meta nem pontos próprios, elas apenas herdam as regras da categoria à qual pertencem.
          </p>
        </div>

        <button
          onClick={openModalNew}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Atividade</span>
        </button>
      </div>

      {/* Barra de Controles: Busca & Filtro */}
      <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar atividade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#161616] border border-[#262626] rounded-lg pl-9 pr-4 py-2 text-white placeholder:text-[#666] focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[#888] uppercase text-[10px] tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-400" />
            Filtrar Categoria:
          </span>
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="bg-[#161616] border border-[#262626] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer"
          >
            <option value="todas">Todas as Categorias</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAtividades.map((ativ) => {
          const cat = categorias.find((c) => c.id === ativ.categoria_id);
          const pilar = pilares.find((p) => p.id === (cat?.pilar_id || ativ.pilar_id));

          return (
            <div
              key={ativ.id}
              className="bg-[#121212] rounded-2xl border border-[#222] p-5 hover:border-[#333] transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header: Category and Pillar tags */}
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#1a1a1a] text-white border border-[#2a2a2a]">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: pilar?.cor || cat?.cor || '#888' }}
                    />
                    {cat?.nome || ativ.categoria_nome || 'Sem categoria'}
                  </span>

                  {pilar && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161616] text-[#888] border border-[#262626]">
                      Pilar: {pilar.nome}
                    </span>
                  )}
                </div>

                {/* Activity Name */}
                <div>
                  <h3 className="text-lg font-bold text-white leading-snug group flex items-center justify-between">
                    {ativ.nome}
                    <div className="flex gap-2">
                       <button
                         onClick={() => openModalEdit(ativ)}
                         className="text-[#555] hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                         title="Editar"
                       >
                         <Edit2 className="w-3.5 h-3.5" />
                       </button>
                       <button
                         onClick={() => { if(confirm('Excluir atividade?')) onDeleteAtividade(ativ.id); }}
                         className="text-[#555] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                         title="Excluir"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  </h3>
                  <span className="text-[11px] font-mono text-[#777]">
                    Unidade: {ativ.unidade} • {ativ.recorrente ? 'Recorrente' : 'Pontual'}
                  </span>
                </div>

                {/* Telegram Command Preview */}
                <div className="bg-[#181818] p-2.5 rounded-xl border border-[#262626] flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <code className="text-[10px] font-mono text-[#aaa]">
                    /feito {cat?.nome?.toLowerCase().split(' ')[0] || 'cat'} {ativ.nome} <span className="text-amber-400/80">[qtd]</span>
                  </code>
                </div>
              </div>

              {/* Status Visual - Apenas informativo de que está ativa */}
              <div className="pt-3 border-t border-[#222] flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#666] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                  Ativa no sistema
                </span>
                <span className="text-[10px] text-[#555] italic">
                  Afeta meta: {ativ.afeta_meta ? 'Sim' : 'Não'}
                </span>
              </div>
            </div>
          );
        })}

        {filteredAtividades.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#666]">
            Nenhuma atividade encontrada com estes filtros.
          </div>
        )}
      </div>

      {/* Modal Nova/Editar Atividade */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111] border border-[#222] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-white font-serif italic">
                {editingAtiv ? 'Editar Atividade' : 'Nova Atividade'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-[#666] hover:text-white cursor-pointer"><X className="w-5 h-5"/></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#888] block mb-1.5">
                  Nome da Atividade
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Leitura Bíblica"
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#888] block mb-1.5">
                  Categoria Vinculada
                </label>
                <select
                  value={catId}
                  onChange={(e) => setCatId(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer"
                >
                  <option value="" disabled>Selecione uma categoria...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#666] mt-1.5">
                  A atividade herda a unidade de medida e os pontos desta categoria.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-[#888] block mb-1.5">
                    Sub-unidade (Opcional)
                  </label>
                  <input
                    type="text"
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    placeholder="Herdar da cat."
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-[#222] bg-[#141414] cursor-pointer">
                <input
                  type="checkbox"
                  checked={recorrente}
                  onChange={(e) => setRecorrente(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 bg-[#222] border-[#333] rounded"
                />
                <span className="text-sm font-medium text-[#ccc]">Atividade Recorrente da Rotina</span>
              </label>

            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-[#333] text-[#888] hover:bg-[#222] text-sm font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!nome.trim() || !catId}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                Salvar Atividade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
