import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  ExternalLink,
  Sparkles,
  CalendarPlus,
  Tag,
  Trash2,
  Pencil,
  Video,
  MapPin,
  RefreshCw,
  FolderTree,
  Check,
  Layers
} from 'lucide-react';
import { AgendamentoItem, AtividadeCadastrada, Categoria, TipoAgendamento } from '../types';

interface CalendarViewProps {
  agendamentos: AgendamentoItem[];
  atividades: AtividadeCadastrada[];
  categorias: Categoria[];
  onAddAgendamento: (item: Omit<AgendamentoItem, 'id'>) => void;
  onUpdateAgendamento: (item: AgendamentoItem) => void;
  onToggleConcluido: (id: string) => void;
  onDeleteAgendamento: (id: string) => void;
  onLimparExemplos?: () => void;
  onSyncGoogleCalendar?: () => void;
  onAddHistorico?: (dados: any) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  agendamentos,
  atividades,
  categorias,
  onAddAgendamento,
  onUpdateAgendamento,
  onToggleConcluido,
  onDeleteAgendamento,
  onLimparExemplos,
  onSyncGoogleCalendar,
  onAddHistorico
}) => {
  // Current view state - Default to current real date
  const today = new Date();
  const defaultYear = today.getFullYear();
  const defaultMonth = today.getMonth();
  const defaultDateStr = `${defaultYear}-${String(defaultMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [currentYear, setCurrentYear] = useState<number>(defaultYear);
  const [currentMonth, setCurrentMonth] = useState<number>(defaultMonth);
  const [selectedDate, setSelectedDate] = useState<string>(defaultDateStr);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TipoAgendamento>('todos');

  // Modals
  const [modalRotinaOpen, setModalRotinaOpen] = useState(false);
  const [modalPontualOpen, setModalPontualOpen] = useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<AgendamentoItem | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editData, setEditData] = useState('');
  const [editHoraInicio, setEditHoraInicio] = useState('');
  const [editHoraFim, setEditHoraFim] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editConcluido, setEditConcluido] = useState(false);

  // Form states for Routine Scheduling
  const [formRotinaAtividadeId, setFormRotinaAtividadeId] = useState<string>(atividades[0]?.id || '');
  const [formRotinaData, setFormRotinaData] = useState<string>(defaultDateStr);
  const [formRotinaHoraInicio, setFormRotinaHoraInicio] = useState<string>('08:00');
  const [formRotinaHoraFim, setFormRotinaHoraFim] = useState<string>('09:00');

  // Form states for Punctual Activity (NO CATEGORY REQUIRED)
  const [formPontualTitulo, setFormPontualTitulo] = useState<string>('');
  const [formPontualData, setFormPontualData] = useState<string>(defaultDateStr);
  const [formPontualHoraInicio, setFormPontualHoraInicio] = useState<string>('14:00');
  const [formPontualHoraFim, setFormPontualHoraFim] = useState<string>('15:00');
  const [formPontualTag, setFormPontualTag] = useState<string>('Pessoal');
  const [formPontualDescricao, setFormPontualDescricao] = useState<string>('');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const setHoje = () => {
    const d = new Date();
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
    setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  // Month metadata
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Calendar days calculation
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust so Monday is first (0: Dom -> 6, 1: Seg -> 0, etc.)
  const startingOffset = (firstDayOfMonth + 6) % 7;
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Filter items
  const filteredItems = agendamentos.filter((item) => {
    if (filtroTipo === 'todos') return true;
    return item.tipo === filtroTipo;
  });

  // Items for the selected day
  const selectedDayItems = filteredItems
    .filter((item) => item.data === selectedDate)
    .sort((a, b) => (a.hora_inicio || '00:00').localeCompare(b.hora_inicio || '00:00'));

  // Handler: Add routine schedule
  const handleSalvarRotina = (e: React.FormEvent) => {
    e.preventDefault();
    const ativ = atividades.find((a) => a.id === formRotinaAtividadeId);
    if (!ativ) return;
    const cat = categorias.find((c) => c.id === ativ.categoria_id);
    const corCat = cat?.cor || '#10b981';

    onAddAgendamento({
      tipo: 'rotina',
      titulo: ativ.nome,
      data: formRotinaData,
      hora_inicio: formRotinaHoraInicio,
      hora_fim: formRotinaHoraFim,
      atividade_id: ativ.id,
      categoria_id: ativ.categoria_id,
      categoria_nome: ativ.categoria_nome,
      cor: corCat,
      concluido: false
    });

    setModalRotinaOpen(false);
  };

  // Handler: Add punctual one-off task
  const handleSalvarPontual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPontualTitulo.trim()) return;

    onAddAgendamento({
      tipo: 'pontual',
      titulo: formPontualTitulo.trim(),
      data: formPontualData,
      hora_inicio: formPontualHoraInicio,
      hora_fim: formPontualHoraFim,
      tag_livre: formPontualTag.trim() || 'Avulso',
      descricao: formPontualDescricao.trim() || undefined,
      concluido: false
    });

    setFormPontualTitulo('');
    setFormPontualDescricao('');
    setModalPontualOpen(false);
  };

  // Trigger Google Calendar sync simulation
  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncMessage('Google Agenda sincronizado com sucesso! (Modo Leitura: eventos ativos)');
      setTimeout(() => setSyncMessage(null), 4000);
      if (onSyncGoogleCalendar) onSyncGoogleCalendar();
    }, 1200);
  };

  const handleOpenEdit = (item: AgendamentoItem) => {
    setEditingItem(item);
    setEditTitulo(item.titulo);
    setEditData(item.data);
    setEditHoraInicio(item.hora_inicio || '08:00');
    setEditHoraFim(item.hora_fim || '09:00');
    setEditDescricao(item.descricao || '');
    setEditConcluido(!!item.concluido);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    onUpdateAgendamento({
      ...editingItem,
      titulo: editTitulo.trim() || editingItem.titulo,
      data: editData,
      hora_inicio: editHoraInicio,
      hora_fim: editHoraFim,
      descricao: editDescricao.trim() || undefined,
      concluido: editConcluido
    });
    setEditingItem(null);
  };

  const handleToggleClick = (item: AgendamentoItem) => {
    if (!item.concluido && item.tipo === 'rotina') {
      const cat = categorias.find(c => c.id === item.categoria_id);
      const input = window.prompt(`Quantos(as) ${cat?.unidade_padrao || 'unidades'} de ${item.titulo} você fez?`);
      if (input !== null) {
         const qtd = Number(input.replace(',','.'));
         if (!isNaN(qtd) && qtd > 0) {
            onAddHistorico?.({
               categoria_id: item.categoria_id,
               atividade_nome: item.titulo,
               valor: qtd
            });
            onToggleConcluido(item.id);
         } else {
            alert('Quantidade inválida!');
         }
      }
    } else {
      onToggleConcluido(item.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions & Sync telemetry */}
      <div className="bg-[#0d0d0d] rounded-2xl border border-[#222] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1a1a1a] text-amber-400 border border-[#2a2a2a]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif italic text-white">
                  Calendário & Agenda
                </h2>
                <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-300 border border-amber-500/25 px-2 py-0.5 rounded-md">
                  Edição de Horários & Dias
                </span>
              </div>
              <p className="text-xs text-[#888] mt-1 font-sans">
                Selecione dias, altere horários livremente, marque atividades como concluídas ou crie novos compromissos pontuais.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onLimparExemplos && (
            <button
              onClick={() => {
                if (window.confirm('Deseja limpar todos os eventos pré-cadastrados para começar do zero com seus próprios horários?')) {
                  onLimparExemplos();
                }
              }}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-[#141414] hover:bg-rose-950/40 text-rose-300 border border-rose-900/30 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Limpar todos os eventos pré-cadastrados"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Limpar Exemplos</span>
            </button>
          )}

          <button
            onClick={() => setModalPontualOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#161616] hover:bg-[#202020] text-purple-300 border border-purple-500/40 hover:border-purple-400 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-purple-400" />
            <span>+ Atividade Pontual</span>
          </button>

          <button
            onClick={() => setModalRotinaOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Rotina</span>
          </button>
        </div>
      </div>

      {/* Synchronized alert feedback */}
      {syncMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between font-mono animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {syncMessage}
          </span>
          <span className="text-[10px] text-emerald-400/70">API Google Calendar</span>
        </div>
      )}

      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d0d0d] p-4 rounded-2xl border border-[#222]">
        {/* Month Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#161616] border border-[#262626] rounded-xl p-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-[#222] text-[#888] hover:text-white transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-serif italic text-white text-base px-3 min-w-[140px] text-center">
              {nomesMeses[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-[#222] text-[#888] hover:text-white transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={setHoje}
            className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#181818] border border-[#2c2c2c] text-[#aaa] hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
          >
            Hoje
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-mono text-[#666] uppercase tracking-wider shrink-0 mr-1">
            Filtrar:
          </span>
          {[
            { id: 'todos', label: 'Todos', count: agendamentos.length, color: 'text-white' },
            {
              id: 'rotina',
              label: 'Rotina',
              count: agendamentos.filter((a) => a.tipo === 'rotina').length,
              color: 'text-blue-400'
            },
            {
              id: 'pontual',
              label: 'Pontuais',
              count: agendamentos.filter((a) => a.tipo === 'pontual').length,
              color: 'text-purple-400'
            },
            {
              id: 'google_agenda',
              label: 'Google Agenda',
              count: agendamentos.filter((a) => a.tipo === 'google_agenda').length,
              color: 'text-emerald-400'
            }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltroTipo(f.id as any)}
              className={`text-xs px-2.5 py-1.5 rounded-xl border font-sans font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filtroTipo === f.id
                  ? 'bg-[#1e1e1e] border-amber-500/40 text-white shadow-xs'
                  : 'bg-[#121212] border-[#222] text-[#777] hover:text-[#bbb] hover:border-[#333]'
              }`}
            >
              <span className={f.color}>{f.label}</span>
              <span className="text-[10px] font-mono opacity-70">({f.count})</span>
            </button>
          ))}

          {/* Sync Button */}
          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="ml-2 p-2 rounded-xl bg-[#161616] border border-[#2a2a2a] hover:border-emerald-500/40 text-emerald-400 transition-colors cursor-pointer disabled:opacity-50"
            title="Sincronizar Google Agenda"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar Month on Left + Day Agenda on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Month View Grid (8 cols) */}
        <div className="lg:col-span-8 bg-[#0d0d0d] rounded-2xl border border-[#222] p-5 shadow-xs">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[11px] font-mono uppercase tracking-wider text-[#666]">
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div className="text-[#888]">Sáb</div>
            <div className="text-[#888]">Dom</div>
          </div>

          {/* Days cells */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells before month start */}
            {Array.from({ length: startingOffset }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="h-24 rounded-xl bg-[#090909] border border-[#181818] opacity-30 p-1.5"
              />
            ))}

            {/* Days in month */}
            {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === defaultDateStr;

              // Items for this day
              const dayItems = filteredItems.filter((it) => it.data === dateStr);
              const rotinaCount = dayItems.filter((it) => it.tipo === 'rotina').length;
              const pontualCount = dayItems.filter((it) => it.tipo === 'pontual').length;
              const gcalCount = dayItems.filter((it) => it.tipo === 'google_agenda').length;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-24 rounded-xl border p-2 flex flex-col justify-between transition-all cursor-pointer select-none relative group ${
                    isSelected
                      ? 'bg-[#181818] border-amber-500 shadow-md ring-1 ring-amber-500/20'
                      : isToday
                      ? 'bg-[#141414] border-amber-500/40 hover:border-amber-500/60'
                      : 'bg-[#101010] border-[#1c1c1c] hover:border-[#2a2a2a] hover:bg-[#141414]'
                  }`}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday
                          ? 'text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded'
                          : isSelected
                          ? 'text-white'
                          : 'text-[#888]'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Today indicator label */}
                    {isToday && (
                      <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 hidden sm:inline">
                        Hoje
                      </span>
                    )}
                  </div>

                  {/* Badges / summary in cell */}
                  <div className="space-y-1 overflow-hidden">
                    {dayItems.slice(0, 2).map((it) => (
                      <div
                        key={it.id}
                        className={`text-[10px] truncate px-1.5 py-0.5 rounded font-sans leading-tight border ${
                          it.tipo === 'rotina'
                            ? 'bg-blue-950/40 text-blue-300 border-blue-900/40'
                            : it.tipo === 'pontual'
                            ? 'bg-purple-950/40 text-purple-300 border-purple-900/40'
                            : 'bg-emerald-950/40 text-emerald-300 border-emerald-900/40'
                        } ${it.concluido ? 'line-through opacity-60' : ''}`}
                      >
                        <span className="font-mono text-[9px] mr-1 opacity-70">
                          {it.hora_inicio || ''}
                        </span>
                        {it.titulo}
                      </div>
                    ))}

                    {dayItems.length > 2 && (
                      <div className="text-[9px] font-mono text-[#777] pl-1">
                        +{dayItems.length - 2} outros
                      </div>
                    )}
                  </div>

                  {/* Bottom indicators */}
                  <div className="flex items-center gap-1 pt-1">
                    {rotinaCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title={`${rotinaCount} Rotina`} />
                    )}
                    {pontualCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" title={`${pontualCount} Pontual`} />
                    )}
                    {gcalCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title={`${gcalCount} Google Agenda`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 pt-4 border-t border-[#1a1a1a] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#777]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Atividade de Rotina (com Categoria)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>Atividade Pontual (Sem Categoria)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Google Agenda (Somente Leitura)</span>
              </span>
            </div>
            <div className="font-mono text-[10px] text-[#555]">
              Clique em um dia para ver os detalhes
            </div>
          </div>
        </div>

        {/* Day Detail & Agenda Timeline (4 cols) */}
        <div className="lg:col-span-4 bg-[#0d0d0d] rounded-2xl border border-[#222] p-5 shadow-xs space-y-4">
          {/* Day header */}
          <div className="border-b border-[#1f1f1f] pb-3 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#777]">
                Agenda do Dia
              </span>
              <h3 className="text-base font-serif italic text-white mt-0.5">
                {(() => {
                  const [y, m, d] = selectedDate.split('-').map(Number);
                  const dateObj = new Date(y, m - 1, d);
                  const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
                  return `${diasSemana[dateObj.getDay()]}, ${d} de ${nomesMeses[m - 1]}`;
                })()}
              </h3>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {selectedDayItems.length} {selectedDayItems.length === 1 ? 'item' : 'itens'}
              </span>
            </div>
          </div>

          {/* Quick add buttons inside the day */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setFormPontualData(selectedDate);
                setModalPontualOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1c1c1c] text-purple-300 border border-purple-900/40 text-left text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarPlus className="w-3 h-3 text-purple-400" />
              <span>+ Pontual</span>
            </button>
            <button
              onClick={() => {
                setFormRotinaData(selectedDate);
                setModalRotinaOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1c1c1c] text-blue-300 border border-blue-900/40 text-left text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-blue-400" />
              <span>+ Rotina</span>
            </button>
          </div>

          {/* Day Items List */}
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {selectedDayItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#666] space-y-2 bg-[#090909] rounded-xl border border-[#1a1a1a]">
                <CalendarIcon className="w-8 h-8 text-[#444] mx-auto opacity-50" />
                <p>Nenhuma atividade ou compromisso para este dia.</p>
                <p className="text-[11px] text-[#555]">
                  Use os botões acima para agendar uma atividade de rotina ou criar um compromisso pontual.
                </p>
              </div>
            ) : (
              selectedDayItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs ${
                    item.tipo === 'rotina'
                      ? 'bg-[#11161d] border-blue-900/40'
                      : item.tipo === 'pontual'
                      ? 'bg-[#17121c] border-purple-900/40'
                      : 'bg-[#101914] border-emerald-900/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 flex-1">
                      {/* Completion checkmark (only for non-google items) */}
                      {item.tipo !== 'google_agenda' ? (
                        <button
                          onClick={() => handleToggleClick(item)}
                          className="mt-0.5 text-[#666] hover:text-amber-400 transition-colors cursor-pointer"
                          title="Marcar como concluído"
                        >
                          {item.concluido ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold text-emerald-400">G</span>
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-semibold text-sm ${
                              item.concluido
                                ? 'line-through text-[#666]'
                                : 'text-white'
                            }`}
                          >
                            {item.titulo}
                          </span>
                        </div>

                        {/* Badges & Meta */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px] font-mono">
                          {item.hora_inicio && (
                            <span className="flex items-center gap-1 text-[#aaa] bg-[#1a1a1a] px-1.5 py-0.5 rounded border border-[#2a2a2a]">
                              <Clock className="w-3 h-3 text-amber-400" />
                              {item.hora_inicio} {item.hora_fim ? `- ${item.hora_fim}` : ''}
                            </span>
                          )}

                          {item.tipo === 'rotina' && item.categoria_nome && (
                            <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded">
                              {item.categoria_nome}
                            </span>
                          )}

                          {item.tipo === 'pontual' && (
                            <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5 text-purple-400" />
                              {item.tag_livre || 'Pontual'} (Sem Categoria)
                            </span>
                          )}

                          {item.tipo === 'google_agenda' && (
                            <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                              Google Agenda (Leitura)
                            </span>
                          )}
                        </div>

                        {/* Description / Location */}
                        {item.descricao && (
                          <p className="text-[11px] text-[#888] mt-1.5 font-sans leading-relaxed">
                            {item.descricao}
                          </p>
                        )}

                        {item.local && (
                          <p className="text-[11px] text-[#777] mt-1 font-sans flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                            {item.local}
                          </p>
                        )}

                        {/* Google Meet Link */}
                        {item.link_reuniao && (
                          <div className="mt-2">
                            <a
                              href={item.link_reuniao}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16231a] hover:bg-[#1d3023] text-emerald-300 border border-emerald-500/30 text-[11px] font-mono transition-colors"
                            >
                              <Video className="w-3 h-3 text-emerald-400" />
                              Entrar na Reunião (Meet)
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Edit & Delete (for non-google items) */}
                    {item.tipo !== 'google_agenda' && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-[#777] hover:text-amber-400 hover:bg-[#1f1f1f] transition-colors cursor-pointer"
                          title="Editar dia, horário ou título"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteAgendamento(item.id)}
                          className="p-1.5 rounded-lg text-[#555] hover:text-red-400 hover:bg-[#1f1f1f] transition-colors cursor-pointer"
                          title="Remover compromisso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick info footer */}
          <div className="p-3 rounded-xl bg-[#121212] border border-[#222] text-[11px] text-[#777] space-y-1">
            <span className="font-semibold text-[#aaa] block">Sincronização Ativa:</span>
            <p>
              Eventos do Google Agenda são exibidos ao lado da sua rotina habitual sem poluir seu banco nem alterar seu calendário original.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Agendar Atividade da Rotina */}
      {modalRotinaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#0f0f0f] border border-[#282828] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-base font-serif italic text-white">
                  Agendar Atividade da Rotina
                </h3>
              </div>
              <button
                onClick={() => setModalRotinaOpen(false)}
                className="text-[#666] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarRotina} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#aaa] font-medium mb-1">
                  Selecione a Atividade Cadastrada:
                </label>
                <select
                  value={formRotinaAtividadeId}
                  onChange={(e) => setFormRotinaAtividadeId(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] rounded-xl px-3 py-2.5 text-white focus:outline-hidden focus:border-amber-500"
                >
                  {atividades.map((ativ) => (
                    <option key={ativ.id} value={ativ.id}>
                      {ativ.nome} ({ativ.categoria_nome})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#aaa] font-medium mb-1">
                  Data:
                </label>
                <input
                  type="date"
                  value={formRotinaData}
                  onChange={(e) => setFormRotinaData(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#aaa] font-medium mb-1">
                    Horário de Início:
                  </label>
                  <input
                    type="time"
                    value={formRotinaHoraInicio}
                    onChange={(e) => setFormRotinaHoraInicio(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#aaa] font-medium mb-1">
                    Horário de Término:
                  </label>
                  <input
                    type="time"
                    value={formRotinaHoraFim}
                    onChange={(e) => setFormRotinaHoraFim(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#222] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalRotinaOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#888] hover:text-white bg-[#161616] border border-[#2a2a2a]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-xs cursor-pointer"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nova Atividade Pontual (SEM CATEGORIA) */}
      {modalPontualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#0f0f0f] border border-[#282828] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-serif italic text-white">
                    Nova Atividade Pontual
                  </h3>
                  <span className="text-[10px] font-mono text-purple-400 block">
                    Sem necessidade de criar categoria
                  </span>
                </div>
              </div>
              <button
                onClick={() => setModalPontualOpen(false)}
                className="text-[#666] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#888] bg-[#15121a] p-3 rounded-xl border border-purple-950/60 leading-relaxed font-sans">
              Ideal para compromissos avulsos como <strong>Dentista</strong>, <strong>Lembrar de comprar remédio</strong>, <strong>Reunião de condomínio</strong> ou recados únicos.
            </p>

            <form onSubmit={handleSalvarPontual} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#aaa] font-medium mb-1">
                  Título do Compromisso / Tarefa:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Consulta Médica, Renovar CNH, Consertar Notebook"
                  value={formPontualTitulo}
                  onChange={(e) => setFormPontualTitulo(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] rounded-xl px-3.5 py-2.5 text-white placeholder-[#555] focus:outline-hidden focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#aaa] font-medium mb-1">
                    Data:
                  </label>
                  <input
                    type="date"
                    value={formPontualData}
                    onChange={(e) => setFormPontualData(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#aaa] font-medium mb-1">
                    Tag Livre (opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Saúde, Casa, Recado"
                    value={formPontualTag}
                    onChange={(e) => setFormPontualTag(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#aaa] font-medium mb-1">
                    Horário Início:
                  </label>
                  <input
                    type="time"
                    value={formPontualHoraInicio}
                    onChange={(e) => setFormPontualHoraInicio(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[#aaa] font-medium mb-1">
                    Horário Término:
                  </label>
                  <input
                    type="time"
                    value={formPontualHoraFim}
                    onChange={(e) => setFormPontualHoraFim(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#aaa] font-medium mb-1">
                  Observações / Detalhes:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Levar documento com foto, endereço na Rua X, número 120"
                  value={formPontualDescricao}
                  onChange={(e) => setFormPontualDescricao(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] rounded-xl px-3.5 py-2 text-white placeholder-[#555] focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-[#222] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalPontualOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#888] hover:text-white bg-[#161616] border border-[#2a2a2a]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-xs cursor-pointer"
                >
                  Criar Atividade Pontual
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Evento (Alterar Horário, Dia, Título e Status) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#111] rounded-2xl border border-[#333] max-w-md w-full p-6 space-y-4 shadow-2xl animate-fadeIn text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-serif italic text-white">
                    Editar Evento & Horários
                  </h3>
                  <p className="text-[11px] text-[#777] font-mono">
                    {editingItem.tipo === 'rotina' ? 'Atividade de Rotina' : 'Atividade Pontual'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-[#666] hover:text-white text-lg transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-[#aaa] font-medium mb-1">
                  Título do Compromisso:
                </label>
                <input
                  type="text"
                  required
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] rounded-xl px-3.5 py-2 text-white placeholder-[#555] focus:outline-hidden focus:border-amber-500 text-xs"
                />
              </div>

              {/* Data (Dia) do Evento */}
              <div>
                <label className="block text-[#aaa] font-medium mb-1 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Data (Dia no Calendário):</span>
                </label>
                <input
                  type="date"
                  required
                  value={editData}
                  onChange={(e) => setEditData(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Horários (Início e Fim) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#aaa] font-medium mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Horário Início:</span>
                  </label>
                  <input
                    type="time"
                    value={editHoraInicio}
                    onChange={(e) => setEditHoraInicio(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[#aaa] font-medium mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Horário Fim:</span>
                  </label>
                  <input
                    type="time"
                    value={editHoraFim}
                    onChange={(e) => setEditHoraFim(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Status do Evento */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#222] bg-[#161616] cursor-pointer hover:bg-[#1a1a1a] transition-colors">
                  <input
                    type="checkbox"
                    checked={editConcluido}
                    onChange={(e) => setEditConcluido(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      {editConcluido ? 'Status: Concluído ✓' : 'Status: Pendente'}
                    </span>
                    <span className="text-[10px] text-[#777] block">
                      Marcar se a tarefa foi finalizada ou ainda será realizada
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-[#aaa] font-medium mb-1">
                  Observações / Detalhes (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  placeholder="Anotações sobre a atividade..."
                  className="w-full bg-[#181818] border border-[#333] rounded-xl px-3.5 py-2 text-white placeholder-[#555] focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-[#222] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs text-[#888] hover:text-white bg-[#161616] border border-[#2a2a2a] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
