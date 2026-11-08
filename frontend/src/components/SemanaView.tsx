import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Categoria, EventoAgenda, Pilar, Registro } from '../types';
import { addDias, ddmm, DIAS_CURTOS, DIAS_LONGOS, diaSemana, hoje, inicioSemana } from '../lib/datas';
import { calcularSemana, formatarNumero, pct } from '../lib/metricas';
import { Card, Titulo, Barra, Chip, btnSecundario } from './ui';

interface SemanaViewProps {
  pilares: Pilar[];
  categorias: Categoria[];
  registros: Registro[];
  eventos: EventoAgenda[];
  agendaConectada: boolean;
}

export const SemanaView: React.FC<SemanaViewProps> = ({
  pilares,
  categorias,
  registros,
  eventos,
  agendaConectada
}) => {
  const [semanaAtual, setSemanaAtual] = useState<string>(() => inicioSemana(hoje()));

  const stats = calcularSemana(
    semanaAtual,
    pilares,
    categorias,
    registros,
    eventos,
    agendaConectada
  );

  const irSemanaAnterior = () => setSemanaAtual((prev) => addDias(prev, -7));
  const irProximaSemana = () => setSemanaAtual((prev) => addDias(prev, 7));
  const irHoje = () => setSemanaAtual(inicioSemana(hoje()));

  return (
    <div className="space-y-6">
      {/* Header com Navegação de Semanas e Resumo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] border border-[#222] p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
            <button
              type="button"
              onClick={irSemanaAnterior}
              className="p-1 text-[#888] hover:text-white transition-colors cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={irHoje}
              className="px-2 py-0.5 text-xs font-mono font-medium text-[#ccc] hover:text-white transition-colors cursor-pointer"
            >
              Esta Semana
            </button>
            <button
              type="button"
              onClick={irProximaSemana}
              className="p-1 text-[#888] hover:text-white transition-colors cursor-pointer"
              title="Próxima semana"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div>
            <span className="text-xs font-mono text-[#888] uppercase tracking-wider block">
              Semana Selecionada
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {ddmm(stats.inicio)} até {ddmm(stats.fim)} ({stats.fim.slice(0, 4)})
            </h2>
          </div>
        </div>

        {/* Indicadores Macro: Aderência e Score */}
        <div className="flex items-center gap-3">
          <div className="bg-[#181818] border border-[#282828] px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#888] block">
              Aderência à Agenda
            </span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {pct(stats.aderencia.pct)}
            </span>
          </div>

          <div className="bg-[#181818] border border-[#282828] px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#888] block">
              Score Semanal
            </span>
            <span className="text-lg font-bold font-mono text-amber-400">
              {stats.score !== null ? `${stats.score}/100` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Alerta de itens pendentes no check-in */}
      {stats.aderencia.pendentes > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/40 p-3 rounded-xl flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Você tem <strong>{stats.aderencia.pendentes}</strong> item(ns) planejado(s) nesta semana que ainda não foram respondidos no check-in.
            </span>
          </div>
        </div>
      )}

      {/* Linha do tempo dos 7 dias da semana (AGORA NO TOPO!) */}
      <Card className="p-4 sm:p-5">
        <Titulo icone={<Calendar className="w-4 h-4 text-amber-400" />}>
          Linha do Tempo da Semana (Visual Diário)
        </Titulo>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2.5 mt-3">
          {stats.dias.map((d) => {
            const dow = diaSemana(d);
            const regsDia = stats.registros
              .filter((r) => r.data === d)
              .sort((a, b) => (a.hora || '99').localeCompare(b.hora || '99'));
            const pendDia = stats.pendentes.filter((x) => x.data === d);
            const ehHoje = d === hoje();

            return (
              <div
                key={d}
                className={`p-3 rounded-xl border text-xs flex flex-col justify-between min-h-[145px] transition-colors ${
                  ehHoje
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-xs'
                    : 'bg-[#121212] border-[#202020]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#1c1c1c]">
                    <span className={`font-semibold ${ehHoje ? 'text-amber-400 font-bold' : 'text-[#ccc]'}`}>
                      {DIAS_CURTOS[dow]}
                    </span>
                    <span className="text-[10px] font-mono text-[#777]">{ddmm(d)}</span>
                  </div>

                  <div className="space-y-1.5">
                    {regsDia.map((r) => {
                      const cat = categorias.find((c) => c.id === r.categoria_id);
                      const pil = pilares.find((p) => p.id === cat?.pilar_id);
                      return (
                        <div
                          key={r.id}
                          className="text-[11px] p-1.5 rounded-lg bg-[#181818] border border-[#252525] flex items-center justify-between gap-1"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: pil?.cor || '#f59e0b' }}
                            />
                            <span className="truncate text-white font-medium" title={cat?.nome || r.titulo}>
                              {cat?.nome || r.titulo}
                            </span>
                          </div>
                          <span className="text-[10px] shrink-0 font-mono">
                            {r.status === 'feito' && '✅'}
                            {r.status === 'parcial' && '🟡'}
                            {r.status === 'nao_feito' && '❌'}
                            {r.status === 'remarcado' && '↪️'}
                          </span>
                        </div>
                      );
                    })}

                    {pendDia.map((p) => (
                      <div
                        key={p.ref_id}
                        className="text-[11px] p-1.5 rounded-lg bg-amber-950/20 border border-amber-800/30 text-amber-300 flex items-center justify-between"
                      >
                        <span className="truncate" title={p.titulo}>{p.titulo}</span>
                        <span className="text-[9px] font-mono">pendente</span>
                      </div>
                    ))}

                    {regsDia.length === 0 && pendDia.length === 0 && (
                      <span className="text-[11px] text-[#555] italic block text-center pt-4">
                        Livre
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Grade de Pilares e Metas */}
      <div className="space-y-4">
        {stats.pilares.map((sp) => {
          if (sp.categorias.length === 0) return null;
          return (
            <Card key={sp.pilar.id} className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1c1c1c]">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: sp.pilar.cor }}
                  />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      {sp.pilar.nome}
                      <span className="text-xs font-normal text-[#777] font-mono">
                        (Peso {sp.pilar.peso_no_score_geral}%)
                      </span>
                    </h3>
                    <p className="text-xs text-[#888] mt-0.5">{sp.pilar.descricao}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-white">
                    {pct(sp.pct)}
                  </span>
                </div>
              </div>

              {/* Categorias do Pilar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sp.categorias.map((sc) => {
                  const c = sc.categoria;
                  const atingiuSessoes =
                    c.meta_semanal_sessoes > 0 && sc.sessoes >= c.meta_semanal_sessoes;
                  const atingiuVolume =
                    c.meta_semanal_volume > 0 && sc.volume >= c.meta_semanal_volume;

                  return (
                    <div
                      key={c.id}
                      className="bg-[#141414] border border-[#202020] p-3.5 rounded-xl hover:border-[#2a2a2a] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-xs sm:text-sm text-white truncate">
                            {c.nome}
                          </span>
                          <span className="text-[10px] font-mono bg-[#1c1c1c] text-amber-300 px-1.5 py-0.5 rounded border border-[#2a2a2a]">
                            [{c.tag}]
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#ddd]">
                          {pct(sc.pct)}
                        </span>
                      </div>

                      {/* Progresso de Sessões / Frequência */}
                      <div className="space-y-1 mb-2">
                        <div className="flex justify-between text-[11px] text-[#888]">
                          <span>Frequência</span>
                          <span>
                            {sc.sessoes} / {c.meta_semanal_sessoes > 0 ? `${c.meta_semanal_sessoes} sessões` : 'livre'}
                          </span>
                        </div>
                        <Barra
                          valor={c.meta_semanal_sessoes > 0 ? sc.sessoes / c.meta_semanal_sessoes : 1}
                          cor={atingiuSessoes ? '#10b981' : sp.pilar.cor}
                          altura={5}
                        />
                      </div>

                      {/* Progresso de Volume (se houver) */}
                      {c.meta_semanal_volume > 0 && (
                        <div className="space-y-1 mt-2">
                          <div className="flex justify-between text-[11px] text-[#888]">
                            <span>Volume</span>
                            <span>
                              {formatarNumero(sc.volume)} / {formatarNumero(c.meta_semanal_volume)} {c.unidade}
                            </span>
                          </div>
                          <Barra
                            valor={sc.volume / c.meta_semanal_volume}
                            cor={atingiuVolume ? '#10b981' : sp.pilar.cor}
                            altura={5}
                          />
                        </div>
                      )}

                      {/* Dias de execução e agendamento */}
                      <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-[#1a1a1a]">
                        <span className="text-[10px] text-[#666] mr-1">Dias:</span>
                        {[1, 2, 3, 4, 5, 6, 0].map((diaIdx) => {
                          const dataDia = stats.dias[diaIdx === 0 ? 6 : diaIdx - 1];
                          const feitoNoDia = stats.registros.some(
                            (r) => r.data === dataDia && r.categoria_id === c.id && (r.status === 'feito' || r.status === 'parcial')
                          );
                          const agendadoNoDia = eventos.some(
                            (ev) => ev.data === dataDia && ev.categoria_id === c.id
                          );

                          return (
                            <span
                              key={diaIdx}
                              className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                                feitoNoDia
                                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                                  : agendadoNoDia
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'text-[#444]'
                              }`}
                            >
                              {DIAS_CURTOS[diaIdx]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
