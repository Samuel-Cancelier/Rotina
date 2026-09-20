import React, { useState } from 'react';
import { History, Plus, Edit2, Trash2, CheckCircle2, X } from 'lucide-react';
import { Categoria, AtividadeCadastrada } from '../types';

export interface HistoricoAtividade {
  id: string;
  categoria_id: string;
  categoria_nome: string;
  atividade_nome: string;
  valor?: number;
  valor_unidade?: number;
  unidade: string;
  pontos_gerados: number;
  data_registro: string;
  ano: number;
  mes: number;
}

interface HistoricoViewProps {
  historico: HistoricoAtividade[];
  categorias: Categoria[];
  atividades: AtividadeCadastrada[];
  onAddHistorico: (dados: any) => Promise<void>;
  onUpdateHistorico: (id: string, dados: any) => Promise<void>;
  onDeleteHistorico: (id: string) => Promise<void>;
}

export const HistoricoView: React.FC<HistoricoViewProps> = ({
  historico,
  categorias,
  atividades,
  onAddHistorico,
  onUpdateHistorico,
  onDeleteHistorico
}) => {
  const [modalNovoOpen, setModalNovoOpen] = useState(false);
  const [novoCatId, setNovoCatId] = useState('');
  const [novaAtividadeNome, setNovaAtividadeNome] = useState('');
  const [novoValor, setNovoValor] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValor, setEditValor] = useState('');

  // Atividades da categoria selecionada para o select
  const atividadesDaCat = atividades.filter(a => a.categoria_id === novoCatId);

  const handleSalvarNovo = async () => {
    if (!novoCatId || !novaAtividadeNome || !novoValor) return;
    await onAddHistorico({
      categoria_id: novoCatId,
      atividade_nome: novaAtividadeNome,
      valor: Number(novoValor)
    });
    setModalNovoOpen(false);
    setNovoCatId('');
    setNovaAtividadeNome('');
    setNovoValor('');
  };

  const handleSalvarEdit = async (h: HistoricoAtividade) => {
    if (!editValor) return;
    await onUpdateHistorico(h.id, { valor: Number(editValor) });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111] rounded-2xl border border-[#222] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
              Histórico & Lançamentos
            </span>
          </div>
          <h2 className="text-xl font-serif italic text-white mt-1">
            Lançamentos Realizados
          </h2>
        </div>
        <button
          onClick={() => setModalNovoOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lançamento Rápido</span>
        </button>
      </div>

      <div className="bg-[#0f0f0f] border border-[#222] rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-[#ddd]">
          <thead className="bg-[#141414] border-b border-[#222] text-xs font-mono uppercase tracking-wider text-[#888]">
            <tr>
              <th className="p-4">Data</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">Atividade</th>
              <th className="p-4 text-right">Quantidade</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {historico.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[#666] italic">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            ) : (
              historico.map(h => {
                const isEditing = editingId === h.id;
                return (
                  <tr key={h.id} className="hover:bg-[#121212] transition-colors">
                    <td className="p-4 font-mono text-xs">{new Date(h.data_registro).toLocaleString()}</td>
                    <td className="p-4 font-medium text-white">{h.categoria_nome}</td>
                    <td className="p-4">{h.atividade_nome}</td>
                    <td className="p-4 text-right font-mono font-bold text-amber-400">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <input
                            type="number"
                            value={editValor}
                            onChange={(e) => setEditValor(e.target.value)}
                            className="w-20 bg-[#222] border border-[#444] rounded px-2 py-1 text-right text-white text-xs"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <>{h.valor ?? h.valor_unidade ?? 0} <span className="text-xs font-normal text-[#888]">{h.unidade}</span></>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleSalvarEdit(h)} className="text-emerald-400 p-1 hover:bg-[#222] rounded cursor-pointer"><CheckCircle2 className="w-4 h-4" /></button>
                          <button onClick={() => setEditingId(null)} className="text-[#888] p-1 hover:bg-[#222] rounded cursor-pointer"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setEditingId(h.id); setEditValor(String(h.valor ?? h.valor_unidade ?? 0)); }}
                            className="text-[#666] hover:text-amber-400 p-1 rounded cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { if(confirm('Excluir este lançamento? Os pontos serão deduzidos.')) onDeleteHistorico(h.id); }}
                            className="text-[#666] hover:text-red-400 p-1 rounded cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalNovoOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111] border border-[#222] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Novo Lançamento Rápido</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#888] block mb-1">Categoria</label>
                <select
                  value={novoCatId}
                  onChange={(e) => { setNovoCatId(e.target.value); setNovaAtividadeNome(''); }}
                  className="w-full bg-[#181818] border border-[#333] rounded-xl p-2.5 text-white text-sm"
                >
                  <option value="">Selecione...</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              
              {novoCatId && (
                <div>
                  <label className="text-xs font-mono text-[#888] block mb-1">Atividade</label>
                  <select
                    value={novaAtividadeNome}
                    onChange={(e) => setNovaAtividadeNome(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] rounded-xl p-2.5 text-white text-sm"
                  >
                    <option value="">Selecione a atividade...</option>
                    {atividadesDaCat.map(a => <option key={a.id} value={a.nome}>{a.nome}</option>)}
                  </select>
                </div>
              )}
              
              {novaAtividadeNome && (
                <div>
                  <label className="text-xs font-mono text-[#888] block mb-1">Quantidade ({categorias.find(c => c.id === novoCatId)?.unidade_padrao})</label>
                  <input
                    type="number"
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value)}
                    placeholder="Ex: 5"
                    className="w-full bg-[#181818] border border-[#333] rounded-xl p-2.5 text-white text-sm"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalNovoOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#333] text-[#888] hover:bg-[#222] text-sm font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarNovo}
                disabled={!novoCatId || !novaAtividadeNome || !novoValor}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold disabled:opacity-50 cursor-pointer"
              >
                Lançar Feito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
