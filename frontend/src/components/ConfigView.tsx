import React, { useState } from 'react';
import {
  Settings,
  Calendar,
  Layers,
  ShieldCheck,
  Target,
  Cloud,
  Check,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  LogOut,
  ExternalLink,
  HelpCircle,
  Key
} from 'lucide-react';
import { Categoria, ConfigGeral, Objetivo, Pilar, PilarId, Unidade } from '../types';
import { AgendaApi } from '../lib/agenda';
import { DIAS_CURTOS } from '../lib/datas';
import { Card, Titulo, btnPrimario, btnSecundario, btnFantasma, inputCls, Chip } from './ui';

interface ConfigViewProps {
  pilares: Pilar[];
  categorias: Categoria[];
  objetivos: Objetivo[];
  config: ConfigGeral;
  agenda: AgendaApi;
  onSalvarPilar: (pilar: Pilar) => void;
  onSalvarCategoria: (cat: Categoria) => void;
  onRemoverCategoria: (id: string) => void;
  onSalvarObjetivo: (obj: Objetivo) => void;
  onRemoverObjetivo: (id: string) => void;
  onSalvarConfig: (cfg: ConfigGeral) => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({
  pilares,
  categorias,
  objetivos,
  config,
  agenda,
  onSalvarPilar,
  onSalvarCategoria,
  onRemoverCategoria,
  onSalvarObjetivo,
  onRemoverObjetivo,
  onSalvarConfig
}) => {
  const [secaoAtiva, setSecaoAtiva] = useState<'agenda' | 'categorias' | 'pilares' | 'objetivos' | 'contexto' | 'nuvem'>('agenda');

  // Estado local para Client ID do Google
  const [clientIdInput, setClientIdInput] = useState<string>(() => localStorage.getItem('rotina2_google_client_id') || '');
  const [nomeCalendarioInput, setNomeCalendarioInput] = useState<string>(config.nome_calendario || 'Rotina');
  const [contextoInput, setContextoInput] = useState<string>(config.contexto || '');

  // Estado para Edição/Criação de Categoria
  const [catEditando, setCatEditando] = useState<Categoria | null>(null);

  // Estado para Edição/Criação de Objetivo
  const [objEditando, setObjEditando] = useState<Objetivo | null>(null);

  // Salvar configurações do Google Agenda
  const handleSalvarAgenda = () => {
    agenda.atualizarClientId(clientIdInput.trim());
    onSalvarConfig({
      ...config,
      nome_calendario: nomeCalendarioInput.trim()
    });
  };

  const handleSalvarContexto = () => {
    onSalvarConfig({
      ...config,
      contexto: contextoInput
    });
  };

  return (
    <div className="space-y-6">
      {/* Abas de Navegação Interna da Configuração */}
      <div className="flex overflow-x-auto space-x-1.5 border-b border-[#222] pb-3 no-scrollbar">
        {[
          { id: 'agenda' as const, label: 'Google Agenda', icon: Calendar },
          { id: 'categorias' as const, label: 'Categorias & Metas', icon: Layers },
          { id: 'pilares' as const, label: 'Pilares & Pesos', icon: ShieldCheck },
          { id: 'objetivos' as const, label: 'Objetivos Longo Prazo', icon: Target },
          { id: 'contexto' as const, label: 'Documento de Contexto', icon: Settings },
          { id: 'nuvem' as const, label: 'Nuvem & Sincronização', icon: Cloud }
        ].map((tab) => {
          const Icon = tab.icon;
          const ativo = secaoAtiva === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSecaoAtiva(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                ativo
                  ? 'bg-amber-500 text-black font-semibold shadow-xs'
                  : 'text-[#888] hover:text-white hover:bg-[#181818]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. GOOGLE AGENDA */}
      {secaoAtiva === 'agenda' && (
        <div className="space-y-4">
          <Card className="p-5">
            <Titulo icone={<Calendar className="w-4 h-4 text-amber-400" />}>
              Integração com o Google Agenda
            </Titulo>
            <p className="text-xs text-[#888] mb-4">
              O app lê seus eventos diários no modo <b>somente leitura</b> diretamente no navegador. Suas credenciais ficam salvas exclusivamente no seu dispositivo.
            </p>

            <div className="space-y-3 max-w-xl">
              <div>
                <label className="block text-xs text-[#aaa] font-medium mb-1">
                  Google Client ID (OAuth 2.0 Web Client):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="Ex: 123456789-abcdef.apps.googleusercontent.com"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={handleSalvarAgenda}
                    className={btnPrimario}
                  >
                    Salvar
                  </button>
                </div>
                <p className="text-[11px] text-[#666] mt-1.5 leading-relaxed">
                  Crie gratuitamente no Google Cloud Console com o escopo <code className="text-amber-300">calendar.readonly</code> e adicione a URL deste app nas origens JavaScript autorizadas.
                </p>
              </div>

              <div>
                <label className="block text-xs text-[#aaa] font-medium mb-1">
                  Nome do Calendário Dedicado aos Hábitos:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nomeCalendarioInput}
                    onChange={(e) => setNomeCalendarioInput(e.target.value)}
                    placeholder="Rotina"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={handleSalvarAgenda}
                    className={btnSecundario}
                  >
                    Atualizar Nome
                  </button>
                </div>
                <p className="text-[11px] text-[#666] mt-1">
                  Recomendado criar um calendário chamado <b>"Rotina"</b> no Google Agenda para isolar os hábitos das reuniões de trabalho.
                </p>
              </div>

              {/* Status de Conexão */}
              <div className="pt-3 border-t border-[#222]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        agenda.conectado ? 'bg-emerald-400 shadow-xs shadow-emerald-400' : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-xs font-semibold text-white">
                      {agenda.conectado ? 'Google Conectado' : 'Google Desconectado'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {agenda.conectado ? (
                      <>
                        <button
                          type="button"
                          onClick={() => agenda.recarregar()}
                          className={btnFantasma}
                          title="Sincronizar eventos agora"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${agenda.carregando ? 'animate-spin' : ''}`} />
                          Sincronizar
                        </button>
                        <button
                          type="button"
                          onClick={() => agenda.desconectar()}
                          className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 flex items-center gap-1 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Desconectar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => agenda.conectar()}
                        disabled={!agenda.clientIdConfigurado}
                        className={btnPrimario}
                      >
                        Conectar Google Agenda
                      </button>
                    )}
                  </div>
                </div>

                {agenda.erro && (
                  <p className="text-xs text-rose-400 mt-2 bg-rose-950/20 p-2 rounded border border-rose-900/30">
                    Erro: {agenda.erro}
                  </p>
                )}
              </div>

              {/* Lista de Calendários Disponíveis */}
              {agenda.conectado && agenda.calendarios.length > 0 && (
                <div className="pt-3 border-t border-[#222]">
                  <label className="block text-xs text-[#aaa] font-medium mb-1.5">
                    Calendários sendo lidos:
                  </label>
                  <div className="space-y-1.5">
                    {agenda.calendarios.map((cal) => {
                      const selecionado = agenda.selecionados.includes(cal.id);
                      return (
                        <label
                          key={cal.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#0f0f0f] border border-[#222] text-xs text-[#ccc] cursor-pointer hover:border-[#333]"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selecionado}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  agenda.setSelecionados([...agenda.selecionados, cal.id]);
                                } else {
                                  agenda.setSelecionados(agenda.selecionados.filter((id) => id !== cal.id));
                                }
                              }}
                              className="rounded border-[#333] bg-[#1a1a1a] text-amber-500 focus:ring-0"
                            />
                            <span>{cal.nome}</span>
                            {cal.primario && (
                              <span className="text-[10px] font-mono text-[#777] bg-[#1a1a1a] px-1.5 rounded">
                                principal
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* 2. CATEGORIAS & HÁBITOS */}
      {secaoAtiva === 'categorias' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Titulo icone={<Layers className="w-4 h-4 text-amber-400" />}>
              Hábitos & Categorias Cadastradas
            </Titulo>
            <button
              type="button"
              onClick={() =>
                setCatEditando({
                  id: `cat_${Date.now()}`,
                  pilar_id: 'pilar_saude',
                  nome: '',
                  tag: '',
                  aliases: [],
                  unidade: 'sessões',
                  valor_padrao: 1,
                  meta_semanal_sessoes: 1,
                  meta_semanal_volume: 0,
                  dias_planejados: []
                })
              }
              className={btnPrimario}
            >
              <Plus className="w-4 h-4" /> Nova Categoria
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categorias.map((c) => {
              const pil = pilares.find((p) => p.id === c.pilar_id);
              return (
                <Card key={c.id} className="p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: pil?.cor || '#666' }}
                        />
                        <h4 className="text-sm font-bold text-white">{c.nome}</h4>
                        <span className="text-[10px] font-mono bg-[#1c1c1c] text-amber-300 px-1.5 py-0.5 rounded border border-[#2a2a2a]">
                          [{c.tag}]
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCatEditando(c)}
                          className="p-1 text-[#888] hover:text-white cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoverCategoria(c.id)}
                          className="p-1 text-[#888] hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#888] mt-1">{pil?.nome}</p>

                    <div className="mt-3 text-xs text-[#aaa] space-y-1">
                      <div>
                        Meta semanal:{' '}
                        <strong>
                          {c.meta_semanal_sessoes > 0 ? `${c.meta_semanal_sessoes} sessões` : 'sem meta de frequência'}
                          {c.meta_semanal_volume > 0 ? ` · ${c.meta_semanal_volume} ${c.unidade}` : ''}
                        </strong>
                      </div>
                      <div>
                        Padrão check-in: <strong>{c.valor_padrao} {c.unidade}</strong>
                      </div>
                      {c.descricao && <p className="text-[11px] text-[#777] italic mt-1">{c.descricao}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-[#1c1c1c]">
                    <span className="text-[10px] text-[#666]">Dias:</span>
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                      <span
                        key={d}
                        className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                          (c.dias_planejados || []).includes(d)
                            ? 'bg-[#222] text-amber-300 border border-[#333]'
                            : 'text-[#444]'
                        }`}
                      >
                        {DIAS_CURTOS[d]}
                      </span>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Modal Edição de Categoria */}
          {catEditando && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl max-w-lg w-full p-5 shadow-2xl text-left max-h-[90vh] overflow-y-auto">
                <h3 className="text-base font-semibold text-white">
                  {categorias.some((x) => x.id === catEditando.id) ? 'Editar Categoria' : 'Nova Categoria'}
                </h3>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs text-[#aaa] font-medium mb-1">Nome:</label>
                    <input
                      type="text"
                      value={catEditando.nome}
                      onChange={(e) => setCatEditando({ ...catEditando, nome: e.target.value })}
                      className={inputCls}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-[#aaa] font-medium mb-1">
                        Tag no Google Agenda (ex: Corrida):
                      </label>
                      <input
                        type="text"
                        value={catEditando.tag}
                        onChange={(e) => setCatEditando({ ...catEditando, tag: e.target.value })}
                        className={inputCls}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#aaa] font-medium mb-1">Pilar:</label>
                      <select
                        value={catEditando.pilar_id}
                        onChange={(e) => setCatEditando({ ...catEditando, pilar_id: e.target.value as PilarId })}
                        className={inputCls}
                      >
                        {pilares.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-[#aaa] font-medium mb-1">Unidade:</label>
                      <input
                        type="text"
                        value={catEditando.unidade}
                        onChange={(e) => setCatEditando({ ...catEditando, unidade: e.target.value })}
                        placeholder="km, páginas, min, h..."
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#aaa] font-medium mb-1">Qtd. Padrão no Check-in:</label>
                      <input
                        type="number"
                        step="any"
                        value={catEditando.valor_padrao}
                        onChange={(e) => setCatEditando({ ...catEditando, valor_padrao: parseFloat(e.target.value) || 0 })}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-[#aaa] font-medium mb-1">Meta Semanal (Sessões):</label>
                      <input
                        type="number"
                        value={catEditando.meta_semanal_sessoes}
                        onChange={(e) => setCatEditando({ ...catEditando, meta_semanal_sessoes: parseInt(e.target.value) || 0 })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#aaa] font-medium mb-1">Meta Semanal (Volume):</label>
                      <input
                        type="number"
                        step="any"
                        value={catEditando.meta_semanal_volume}
                        onChange={(e) => setCatEditando({ ...catEditando, meta_semanal_volume: parseFloat(e.target.value) || 0 })}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#aaa] font-medium mb-1.5">Dias Ideais de Execução:</label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                        const ativo = (catEditando.dias_planejados || []).includes(d);
                        return (
                          <Chip
                            key={d}
                            ativo={ativo}
                            onClick={() => {
                              const dias = catEditando.dias_planejados || [];
                              setCatEditando({
                                ...catEditando,
                                dias_planejados: ativo ? dias.filter((x) => x !== d) : [...dias, d]
                              });
                            }}
                          >
                            {DIAS_CURTOS[d]}
                          </Chip>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#aaa] font-medium mb-1">Descrição / Instruções:</label>
                    <textarea
                      rows={2}
                      value={catEditando.descricao || ''}
                      onChange={(e) => setCatEditando({ ...catEditando, descricao: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-[#222]">
                  <button type="button" onClick={() => setCatEditando(null)} className={btnFantasma}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSalvarCategoria(catEditando);
                      setCatEditando(null);
                    }}
                    className={btnPrimario}
                  >
                    Salvar Categoria
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. PILARES & PESOS */}
      {secaoAtiva === 'pilares' && (
        <div className="space-y-4">
          <Card className="p-5">
            <Titulo icone={<ShieldCheck className="w-4 h-4 text-amber-400" />}>
              Pilares de Vida & Pesos no Score Geral
            </Titulo>
            <p className="text-xs text-[#888] mb-4">
              A soma dos pesos deve totalizar 100%. Cada pilar avalia o cumprimento das metas das categorias pertencentes a ele.
            </p>

            <div className="space-y-3">
              {pilares.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-[#0f0f0f] border border-[#222] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.cor }} />
                    <div>
                      <h4 className="text-sm font-bold text-white">{p.nome}</h4>
                      <p className="text-xs text-[#777]">{p.descricao}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#aaa]">Peso:</label>
                    <input
                      type="number"
                      value={p.peso_no_score_geral}
                      onChange={(e) =>
                        onSalvarPilar({
                          ...p,
                          peso_no_score_geral: parseInt(e.target.value) || 0
                        })
                      }
                      className="w-16 bg-[#181818] border border-[#333] rounded px-2 py-1 text-xs text-white font-mono text-center"
                    />
                    <span className="text-xs font-mono text-[#888]">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-right text-xs font-mono">
              Soma total:{' '}
              <strong
                className={
                  pilares.reduce((a, b) => a + b.peso_no_score_geral, 0) === 100
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }
              >
                {pilares.reduce((a, b) => a + b.peso_no_score_geral, 0)}%
              </strong>
            </div>
          </Card>
        </div>
      )}

      {/* 4. OBJETIVOS DE LONGO PRAZO */}
      {secaoAtiva === 'objetivos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Titulo icone={<Target className="w-4 h-4 text-amber-400" />}>
              Objetivos de Médio e Longo Prazo ("Prêmios")
            </Titulo>
            <button
              type="button"
              onClick={() =>
                setObjEditando({
                  id: `obj_${Date.now()}`,
                  pilar_id: 'pilar_profissional',
                  titulo: '',
                  descricao: '',
                  status: 'ativo'
                })
              }
              className={btnPrimario}
            >
              <Plus className="w-4 h-4" /> Novo Objetivo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {objetivos.map((o) => {
              const pil = pilares.find((p) => p.id === o.pilar_id);
              return (
                <Card key={o.id} className="p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pil?.cor }} />
                        <h4 className="text-sm font-bold text-white">{o.titulo}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setObjEditando(o)}
                          className="p-1 text-[#888] hover:text-white cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoverObjetivo(o.id)}
                          className="p-1 text-[#888] hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#777] block mt-0.5">{pil?.nome}</span>
                    {o.descricao && <p className="text-xs text-[#aaa] mt-2 leading-relaxed">{o.descricao}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#1c1c1c] text-[11px] font-mono">
                    <span className="text-emerald-400 font-semibold uppercase">{o.status}</span>
                    {o.prazo && <span className="text-[#666]">Prazo: {o.prazo}</span>}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Modal Edição de Objetivo */}
          {objEditando && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl max-w-md w-full p-5 shadow-2xl text-left">
                <h3 className="text-base font-semibold text-white">Objetivo de Longo Prazo</h3>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs text-[#aaa] font-medium mb-1">Título do Objetivo:</label>
                    <input
                      type="text"
                      value={objEditando.titulo}
                      onChange={(e) => setObjEditando({ ...objEditando, titulo: e.target.value })}
                      className={inputCls}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#aaa] font-medium mb-1">Pilar:</label>
                    <select
                      value={objEditando.pilar_id}
                      onChange={(e) => setObjEditando({ ...objEditando, pilar_id: e.target.value as PilarId })}
                      className={inputCls}
                    >
                      {pilares.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[#aaa] font-medium mb-1">Descrição / Detalhes:</label>
                    <textarea
                      rows={3}
                      value={objEditando.descricao || ''}
                      onChange={(e) => setObjEditando({ ...objEditando, descricao: e.target.value })}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#aaa] font-medium mb-1">Prazo (opcional):</label>
                    <input
                      type="date"
                      value={objEditando.prazo || ''}
                      onChange={(e) => setObjEditando({ ...objEditando, prazo: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-[#222]">
                  <button type="button" onClick={() => setObjEditando(null)} className={btnFantasma}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSalvarObjetivo(objEditando);
                      setObjEditando(null);
                    }}
                    className={btnPrimario}
                  >
                    Salvar Objetivo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. DOCUMENTO DE CONTEXTO */}
      {secaoAtiva === 'contexto' && (
        <div className="space-y-4">
          <Card className="p-5">
            <Titulo icone={<Settings className="w-4 h-4 text-amber-400" />}>
              Documento de Contexto da Sua Vida
            </Titulo>
            <p className="text-xs text-[#888] mb-4">
              Este documento é anexado ao seu Relatório Semanal e às Instruções do Gem para que o Gemini compreenda sua vida, seus momentos analógicos, a agência FEIT e o trabalho na Cresol sem você precisar explicar tudo de novo.
            </p>

            <textarea
              rows={14}
              value={contextoInput}
              onChange={(e) => setContextoInput(e.target.value)}
              className={`${inputCls} font-mono text-xs leading-relaxed`}
            />

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSalvarContexto}
                className={btnPrimario}
              >
                Salvar Contexto
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* 6. NUVEM & SINCRONIZAÇÃO */}
      {secaoAtiva === 'nuvem' && (
        <div className="space-y-4">
          <Card className="p-5">
            <Titulo icone={<Cloud className="w-4 h-4 text-amber-400" />}>
              Sincronização com Cloudflare & Firestore
            </Titulo>
            <p className="text-xs text-[#888] mb-4">
              O app salva tudo localmente no navegador (offline-first). Se você publicou o Cloudflare Worker, configure a URL aqui para sincronizar seus dados na nuvem Firestore.
            </p>

            <div className="space-y-3 max-w-xl">
              <div>
                <label className="block text-xs text-[#aaa] font-medium mb-1">
                  URL da API (Cloudflare Worker):
                </label>
                <input
                  type="text"
                  defaultValue={localStorage.getItem('ROTINA_API_URL') || ''}
                  onBlur={(e) => localStorage.setItem('ROTINA_API_URL', e.target.value.trim())}
                  placeholder="Ex: https://rotina-metas-api.seu-nome.workers.dev"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs text-[#aaa] font-medium mb-1">
                  Chave Secreta da API (API_SECRET_KEY):
                </label>
                <input
                  type="password"
                  defaultValue={localStorage.getItem('API_SECRET_KEY') || ''}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val) localStorage.setItem('API_SECRET_KEY', val);
                    else localStorage.removeItem('API_SECRET_KEY');
                  }}
                  placeholder="Sua senha da API"
                  className={inputCls}
                />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
