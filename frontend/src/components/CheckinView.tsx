import React, { useState } from 'react';
import {
  Check,
  X,
  Minus,
  RotateCcw,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  EyeOff,
  Tag,
  MessageSquare,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Categoria, ItemPlanejado, MOTIVOS, Pilar, Registro, StatusRegistro } from '../types';
import { ddmm, hoje, novoId, rotuloRelativo } from '../lib/datas';
import { itensPlanejados, contaComoFeito } from '../lib/metricas';
import { EventoAgenda } from '../types';
import { Card, Titulo, btnPrimario, btnSecundario, btnFantasma, inputCls, Chip } from './ui';

interface CheckinViewProps {
  pilares: Pilar[];
  categorias: Categoria[];
  registros: Registro[];
  eventos: EventoAgenda[];
  agendaConectada: boolean;
  onSalvarRegistro: (reg: Registro) => void;
  onRemoverRegistro: (id: string) => void;
}

export const CheckinView: React.FC<CheckinViewProps> = ({
  pilares,
  categorias,
  registros,
  eventos,
  agendaConectada,
  onSalvarRegistro,
  onRemoverRegistro
}) => {
  // Janela de dias a cobrar no check-in: últimos 3 dias até hoje
  const h = hoje();
  const dOntem = new Date();
  dOntem.setDate(dOntem.getDate() - 1);
  const sOntem = dOntem.toISOString().split('T')[0];
  const dAnteontem = new Date();
  dAnteontem.setDate(dAnteontem.getDate() - 2);
  const sAnteontem = dAnteontem.toISOString().split('T')[0];

  const diasCheckin = [sAnteontem, sOntem, h];

  const planejados = itensPlanejados(diasCheckin, categorias, eventos, agendaConectada);
  const regsPorRef = new Map(registros.filter((r) => r.ref_id).map((r) => [r.ref_id!, r]));

  // Itens pendentes de resposta (que já terminaram ou são de dias passados)
  const pendentesGeral = planejados.filter((item) => {
    const jaRespondido = regsPorRef.has(item.ref_id);
    return !jaRespondido && (item.terminou || item.data < h);
  });

  // SEPARAÇÃO SOLICITADA PELO USUÁRIO:
  // 1. O que é Rotina de verdade (identificado por tag ou categoria específica configurada)
  const pendentesRotina = pendentesGeral.filter(
    (item) => item.categoria_id && item.categoria_id !== 'cat_geral'
  );

  // 2. O que são outros eventos soltos da agenda (F1, Finados, lembretes, compromissos avulsos)
  const pendentesOutros = pendentesGeral.filter(
    (item) => !item.categoria_id || item.categoria_id === 'cat_geral'
  );

  // Itens planejados para hoje ainda por acontecer
  const futurosHoje = planejados.filter((item) => {
    const jaRespondido = regsPorRef.has(item.ref_id);
    return !jaRespondido && !item.terminou && item.data === h;
  });

  // Registros recentes já respondidos nestes dias
  const respondidosRecentes = registros
    .filter((r) => diasCheckin.includes(r.data))
    .sort((a, b) => (b.data + (b.hora || '99')).localeCompare(a.data + (a.hora || '99')));

  // Modal / Gaveta de Ação rápida para responder um item
  const [itemAtivo, setItemAtivo] = useState<ItemPlanejado | null>(null);
  const [statusAtivo, setStatusAtivo] = useState<StatusRegistro>('feito');
  const [valorInput, setValorInput] = useState<number>(1);
  const [motivoInput, setMotivoInput] = useState<string>('');
  const [notaInput, setNotaInput] = useState<string>('');
  const [categoriaEscolhidaId, setCategoriaEscolhidaId] = useState<string>('');

  // Lançamento livre (fora da agenda)
  const [mostrarForaAgenda, setMostrarForaAgenda] = useState(false);
  const [catForaId, setCatForaId] = useState<string>(categorias[0]?.id || '');
  const [dataFora, setDataFora] = useState<string>(h);
  const [valorFora, setValorFora] = useState<number>(1);
  const [notaFora, setNotaFora] = useState<string>('');

  const abrirResposta = (item: ItemPlanejado, status: StatusRegistro) => {
    setItemAtivo(item);
    setStatusAtivo(status);
    // Categoria inicial: usa a categoria já identificada no evento, ou a primeira válida, ou geral
    const catInicial =
      item.categoria_id ||
      (item.categoria_id === null ? 'cat_geral' : (categorias.find((c) => !c.inativa && c.id !== 'cat_geral')?.id || 'cat_geral'));
    setCategoriaEscolhidaId(catInicial);

    const cat = categorias.find((c) => c.id === catInicial);
    setValorInput(item.valor_sugerido || cat?.valor_padrao || 1);
    setMotivoInput('');
    setNotaInput('');
  };

  const confirmarResposta = () => {
    if (!itemAtivo) return;

    // Se o usuário selecionou uma categoria no modal para um evento solto, usa ela!
    const finalCatId =
      categoriaEscolhidaId ||
      itemAtivo.categoria_id ||
      'cat_geral';

    const cat = categorias.find((c) => c.id === finalCatId);

    const novoReg: Registro = {
      id: novoId('reg'),
      data: itemAtivo.data,
      hora: itemAtivo.hora,
      categoria_id: finalCatId,
      status: statusAtivo,
      valor: statusAtivo === 'nao_feito' ? 0 : Number(valorInput) || 0,
      unidade: cat?.unidade || 'un',
      titulo: itemAtivo.titulo,
      motivo: statusAtivo === 'nao_feito' ? motivoInput : undefined,
      nota: notaInput.trim() ? notaInput.trim() : undefined,
      origem: itemAtivo.origem,
      ref_id: itemAtivo.ref_id,
      criado_em: new Date().toISOString()
    };
    onSalvarRegistro(novoReg);
    setItemAtivo(null);
  };

  // Ignorar evento que não é rotina (descarte com 1 clique)
  const ignorarItem = (item: ItemPlanejado) => {
    const novoReg: Registro = {
      id: novoId('reg_ignorado'),
      data: item.data,
      hora: item.hora,
      categoria_id: item.categoria_id || 'cat_geral',
      status: 'ignorado',
      valor: 0,
      unidade: 'un',
      titulo: item.titulo,
      origem: item.origem,
      ref_id: item.ref_id,
      criado_em: new Date().toISOString()
    };
    onSalvarRegistro(novoReg);
  };

  const ignorarTodosOutros = () => {
    pendentesOutros.forEach((item) => ignorarItem(item));
  };

  const salvarForaAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categorias.find((c) => c.id === catForaId);
    if (!cat) return;
    const novoReg: Registro = {
      id: novoId('reg_manual'),
      data: dataFora,
      categoria_id: cat.id,
      status: 'feito',
      valor: Number(valorFora) || cat.valor_padrao || 1,
      unidade: cat.unidade,
      titulo: `${cat.nome} (extra)`,
      nota: notaFora.trim() ? notaFora.trim() : undefined,
      origem: 'manual',
      criado_em: new Date().toISOString()
    };
    onSalvarRegistro(novoReg);
    setNotaFora('');
    setMostrarForaAgenda(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner de status / boas-vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-[#141414] to-[#141414] border border-amber-500/20 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
              Check-in Diário
            </span>
            <span className="text-xs text-[#888] font-mono">{rotuloRelativo(h)}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Prestação de Contas da Sua Rotina
          </h1>
          <p className="text-xs sm:text-sm text-[#999] mt-1 max-w-xl">
            {agendaConectada
              ? 'Lendo seus eventos do Google Agenda. Seus hábitos configurados ficam no topo para confirmação rápida.'
              : 'Google Agenda desconectado: usando o plano semanal padrão cadastrado nas categorias.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMostrarForaAgenda(true)}
          className={btnPrimario}
        >
          <Plus className="w-4 h-4" />
          Fiz algo fora da agenda
        </button>
      </div>

      {/* SEÇÃO 1: HÁBITOS E ROTINAS DA SEMANA (EM DESTAQUE NO TOPO) */}
      <div>
        <Titulo
          icone={<AlertCircle className="w-4 h-4 text-emerald-400" />}
          extra={
            <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              {pendentesRotina.length} {pendentesRotina.length === 1 ? 'rotina pendente' : 'rotinas pendentes'}
            </span>
          }
        >
          Hábitos & Rotinas para responder
        </Titulo>

        {pendentesRotina.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Todas as rotinas em dia!</h3>
            <p className="text-xs text-[#888] mt-0.5 max-w-md mx-auto">
              Nenhum treino, corrida, leitura ou hábito planejado está pendente.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendentesRotina.map((item) => {
              const cat = categorias.find((c) => c.id === item.categoria_id);
              const pil = pilares.find((p) => p.id === cat?.pilar_id);
              return (
                <Card
                  key={item.ref_id}
                  className="p-3.5 sm:p-4 hover:border-[#333] transition-colors flex flex-col justify-between border-l-4"
                  style={{ borderLeftColor: pil?.cor || '#10b981' }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[11px] font-mono text-[#aaa]">
                        {rotuloRelativo(item.data)}
                        {item.hora ? ` · ${item.hora}` : ''}
                      </span>
                      {item.tag && (
                        <span className="text-[10px] font-mono bg-[#1c1c1c] text-amber-300 px-1.5 py-0.5 rounded border border-[#2a2a2a]">
                          [{item.tag}]
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-white truncate" title={item.titulo}>
                      {item.titulo}
                    </h4>
                    <p className="text-xs text-[#777] mt-0.5">
                      {cat?.nome} • Sugerido:{' '}
                      <strong className="text-[#ccc]">
                        {item.valor_sugerido} {cat?.unidade || 'un'}
                      </strong>
                    </p>
                  </div>

                  {/* Botões rápidos de resposta */}
                  <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-[#1c1c1c]">
                    <button
                      type="button"
                      onClick={() => abrirResposta(item, 'feito')}
                      className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/40 text-xs font-semibold cursor-pointer transition-colors active:scale-95"
                    >
                      <Check className="w-4 h-4 mb-0.5" />
                      <span>Fiz</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirResposta(item, 'parcial')}
                      className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 border border-amber-800/40 text-xs font-semibold cursor-pointer transition-colors active:scale-95"
                    >
                      <Minus className="w-4 h-4 mb-0.5" />
                      <span>Parcial</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirResposta(item, 'nao_feito')}
                      className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 text-xs font-semibold cursor-pointer transition-colors active:scale-95"
                    >
                      <X className="w-4 h-4 mb-0.5" />
                      <span>Não fiz</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirResposta(item, 'remarcado')}
                      className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-[#181818] hover:bg-[#222] text-[#999] hover:text-white border border-[#2a2a2a] text-xs font-medium cursor-pointer transition-colors active:scale-95"
                      title="Movi para outro dia / horário na agenda"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mb-0.5" />
                      <span className="text-[11px]">Remarcar</span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* SEÇÃO 2: OUTROS EVENTOS & LEMBRETES DA AGENDA (F1, FERIADOS, TAREFAS AVULSAS) */}
      {pendentesOutros.length > 0 && (
        <div className="pt-4 border-t border-[#1c1c1c]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#888] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#777]" />
                Outros Eventos & Lembretes da Agenda ({pendentesOutros.length})
              </h3>
              <p className="text-[11px] text-[#666]">
                Estes eventos não têm tag de rotina e não afetam seu score. Você pode descartá-los ou vincular a uma rotina.
              </p>
            </div>

            <button
              type="button"
              onClick={ignorarTodosOutros}
              className="text-xs text-[#888] hover:text-white bg-[#161616] hover:bg-[#202020] border border-[#2a2a2a] px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Ignorar todos que não são rotina
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendentesOutros.map((item) => (
              <Card
                key={item.ref_id}
                className="p-3.5 bg-[#0e0e0e] border-[#1e1e1e] hover:border-[#2a2a2a] transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-mono text-[#777]">
                      {rotuloRelativo(item.data)}
                      {item.hora ? ` · ${item.hora}` : ' (dia inteiro)'}
                    </span>
                    <span className="text-[10px] font-mono bg-[#161616] text-[#777] px-1.5 py-0.5 rounded border border-[#222]">
                      Não é rotina
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-[#ddd] truncate" title={item.titulo}>
                    {item.titulo}
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-[#181818]">
                  <button
                    type="button"
                    onClick={() => abrirResposta(item, 'feito')}
                    className="py-1.5 px-2 rounded-lg bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-300 border border-emerald-800/30 text-xs font-medium cursor-pointer transition-colors"
                  >
                    Fiz
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirResposta(item, 'nao_feito')}
                    className="py-1.5 px-2 rounded-lg bg-rose-950/20 hover:bg-rose-900/30 text-rose-300 border border-rose-800/30 text-xs font-medium cursor-pointer transition-colors"
                  >
                    Não fiz
                  </button>
                  <button
                    type="button"
                    onClick={() => ignorarItem(item)}
                    className="py-1.5 px-2 rounded-lg bg-[#161616] hover:bg-[#202020] text-[#888] hover:text-white border border-[#2a2a2a] text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1"
                    title="Descartar este evento (não é um hábito)"
                  >
                    <EyeOff className="w-3 h-3" />
                    <span>Ignorar</span>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* SEÇÃO 3: PROGRAMADO PARA HOJE MAIS TARDE */}
      {futurosHoje.length > 0 && (
        <div>
          <Titulo icone={<Clock className="w-4 h-4 text-blue-400" />}>
            Programado para hoje mais tarde
          </Titulo>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {futurosHoje.map((item) => {
              const cat = categorias.find((c) => c.id === item.categoria_id);
              const ehRotina = item.categoria_id && item.categoria_id !== 'cat_geral';
              return (
                <div
                  key={item.ref_id}
                  className="bg-[#0f0f0f] border border-[#222] p-3 rounded-xl flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#888]">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span>{item.hora || 'Hoje'}</span>
                      {ehRotina && item.tag && (
                        <span className="text-[9px] text-amber-300 bg-[#1c1c1c] px-1 rounded">
                          [{item.tag}]
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-white truncate mt-0.5">{item.titulo}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => abrirResposta(item, 'feito')}
                    className="shrink-0 px-2.5 py-1 text-xs rounded-md bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/50 font-medium cursor-pointer"
                  >
                    Já fiz
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SEÇÃO 4: HISTÓRICO RECENTE DE LANÇAMENTOS */}
      <div>
        <Titulo icone={<Calendar className="w-4 h-4 text-[#888]" />}>
          Lançamentos recentes (últimos 3 dias)
        </Titulo>

        {respondidosRecentes.length === 0 ? (
          <Card className="p-6 text-center text-xs text-[#666]">
            Nenhum registro nos últimos dias ainda.
          </Card>
        ) : (
          <div className="space-y-2">
            {respondidosRecentes
              .filter((r) => r.status !== 'ignorado')
              .map((r) => {
                const cat = categorias.find((c) => c.id === r.categoria_id);
                const pil = pilares.find((p) => p.id === cat?.pilar_id);
                const statusCor =
                  r.status === 'feito'
                    ? 'text-emerald-400 bg-emerald-950/30 border-emerald-800/40'
                    : r.status === 'parcial'
                    ? 'text-amber-400 bg-amber-950/30 border-amber-800/40'
                    : r.status === 'nao_feito'
                    ? 'text-rose-400 bg-rose-950/30 border-rose-800/40'
                    : 'text-[#888] bg-[#181818] border-[#2a2a2a]';

                return (
                  <div
                    key={r.id}
                    className="bg-[#101010] border border-[#1e1e1e] p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: pil?.cor || '#666' }}
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{cat?.nome || r.titulo}</span>
                          {r.origem === 'manual' && (
                            <span className="text-[10px] font-mono bg-purple-950/40 text-purple-300 border border-purple-800/40 px-1.5 rounded">
                              extra
                            </span>
                          )}
                          <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${statusCor}`}>
                            {r.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#777] flex items-center gap-2 mt-0.5">
                          <span>{rotuloRelativo(r.data)}</span>
                          {contaComoFeito(r) && (
                            <span>
                              • {r.valor} {r.unidade}
                            </span>
                          )}
                          {r.motivo && <span className="text-rose-400/80">• Motivo: {r.motivo}</span>}
                          {r.nota && <span className="italic text-[#aaa]">• "{r.nota}"</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoverRegistro(r.id)}
                      className="text-[#555] hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                      title="Excluir este lançamento"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* MODAL DE RESPOSTA (COM SELETOR DE CATEGORIA SE FOR EVENTO SOLTO) */}
      {itemAtivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl max-w-md w-full p-5 shadow-2xl text-left">
            <h3 className="text-base font-semibold text-white">
              {statusAtivo === 'feito' && 'Confirmar Hábito Cumprido'}
              {statusAtivo === 'parcial' && 'Registro Parcial'}
              {statusAtivo === 'nao_feito' && 'Não Consegui Fazer'}
              {statusAtivo === 'remarcado' && 'Hábito Remarcado'}
            </h3>
            <p className="text-xs text-[#888] mt-1">
              {itemAtivo.titulo} • {rotuloRelativo(itemAtivo.data)}
            </p>

            <div className="mt-4 space-y-3.5">
              {/* SELETOR DE CATEGORIA / HÁBITO (SEMPRE EDITÁVEL) */}
              <div className="bg-[#181818] border border-[#262626] p-3 rounded-xl">
                <label className="block text-xs font-semibold text-[#ddd] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    Categoria do Hábito:
                  </span>
                  {categoriaEscolhidaId && categoriaEscolhidaId !== 'cat_geral' && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `${pilares.find((p) => p.id === categorias.find((c) => c.id === categoriaEscolhidaId)?.pilar_id)?.cor || '#10b981'}20`,
                        color: pilares.find((p) => p.id === categorias.find((c) => c.id === categoriaEscolhidaId)?.pilar_id)?.cor || '#10b981'
                      }}
                    >
                      {pilares.find((p) => p.id === categorias.find((c) => c.id === categoriaEscolhidaId)?.pilar_id)?.nome}
                    </span>
                  )}
                </label>
                <select
                  value={categoriaEscolhidaId}
                  onChange={(e) => {
                    const novaCatId = e.target.value;
                    setCategoriaEscolhidaId(novaCatId);
                    const c = categorias.find((k) => k.id === novaCatId);
                    if (c && c.valor_padrao) {
                      setValorInput(c.valor_padrao);
                    }
                  }}
                  className={inputCls}
                >
                  <optgroup label="Seus Hábitos & Metas da Rotina">
                    {categorias
                      .filter((c) => !c.inativa && c.id !== 'cat_geral')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome} ({c.unidade})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Outro">
                    <option value="cat_geral">
                      Compromisso geral (não pontua nas metas)
                    </option>
                  </optgroup>
                </select>
                {itemAtivo.categoria_id && categoriaEscolhidaId !== itemAtivo.categoria_id && (
                  <p className="text-[11px] text-amber-400 mt-1.5 flex items-center gap-1 font-sans">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    Alterado de{' '}
                    <strong>
                      {categorias.find((c) => c.id === itemAtivo.categoria_id)?.nome || 'Outro'}
                    </strong>{' '}
                    para{' '}
                    <strong>
                      {categorias.find((c) => c.id === categoriaEscolhidaId)?.nome || 'Geral'}
                    </strong>
                    .
                  </p>
                )}
              </div>

              {/* Se feito ou parcial, pede a quantidade */}
              {(statusAtivo === 'feito' || statusAtivo === 'parcial') && (
                <div>
                  <label className="block text-xs text-[#aaa] font-medium mb-1">
                    Quantidade realizada (
                    {
                      categorias.find(
                        (c) => c.id === (categoriaEscolhidaId || itemAtivo.categoria_id)
                      )?.unidade || 'un'
                    }
                    ):
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={valorInput}
                    onChange={(e) => setValorInput(parseFloat(e.target.value) || 0)}
                    className={inputCls}
                    autoFocus
                  />
                </div>
              )}

              {/* Se não feito, botões rápidos com motivos */}
              {statusAtivo === 'nao_feito' && (
                <div>
                  <label className="block text-xs text-[#aaa] font-medium mb-1.5">
                    O que aconteceu? (Motivo):
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {MOTIVOS.map((m) => (
                      <Chip
                        key={m}
                        ativo={motivoInput === m}
                        onClick={() => setMotivoInput(m)}
                        cor="#f43f5e"
                      >
                        {m}
                      </Chip>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={motivoInput}
                    onChange={(e) => setMotivoInput(e.target.value)}
                    placeholder="Ou digite outro motivo..."
                    className={inputCls}
                  />
                </div>
              )}

              {/* Nota opcional */}
              <div>
                <label className="block text-xs text-[#aaa] font-medium mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-amber-400" />
                  Nota / Observação (opcional, vai para o relatório):
                </label>
                <input
                  type="text"
                  value={notaInput}
                  onChange={(e) => setNotaInput(e.target.value)}
                  placeholder="Ex: Treino rendeu muito; Sprint atrasou"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-[#222]">
              <button
                type="button"
                onClick={() => setItemAtivo(null)}
                className={btnFantasma}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarResposta}
                className={btnPrimario}
              >
                Salvar Check-in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Lançamento fora da Agenda */}
      {mostrarForaAgenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <form
            onSubmit={salvarForaAgenda}
            className="bg-[#141414] border border-[#2a2a2a] rounded-xl max-w-md w-full p-5 shadow-2xl text-left"
          >
            <h3 className="text-base font-semibold text-white">Lançar Atividade Fora da Agenda</h3>
            <p className="text-xs text-[#888] mt-1">
              Fez um treino extra, pintura ou adiantou a leitura? Registre aqui.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-[#aaa] font-medium mb-1">Categoria:</label>
                <select
                  value={catForaId}
                  onChange={(e) => {
                    setCatForaId(e.target.value);
                    const c = categorias.find((k) => k.id === e.target.value);
                    if (c) setValorFora(c.valor_padrao);
                  }}
                  className={inputCls}
                >
                  {categorias
                    .filter((c) => !c.inativa && c.id !== 'cat_geral')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.unidade})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-[#aaa] font-medium mb-1">Data:</label>
                  <input
                    type="date"
                    value={dataFora}
                    onChange={(e) => setDataFora(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#aaa] font-medium mb-1">
                    Quantidade ({categorias.find((c) => c.id === catForaId)?.unidade}):
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={valorFora}
                    onChange={(e) => setValorFora(parseFloat(e.target.value) || 0)}
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#aaa] font-medium mb-1">Nota (opcional):</label>
                <input
                  type="text"
                  value={notaFora}
                  onChange={(e) => setNotaFora(e.target.value)}
                  placeholder="Ex: Treino surpresa no parque"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-[#222]">
              <button
                type="button"
                onClick={() => setMostrarForaAgenda(false)}
                className={btnFantasma}
              >
                Cancelar
              </button>
              <button type="submit" className={btnPrimario}>
                Salvar Lançamento
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
