import { Categoria, EventoAgenda, ItemPlanejado, Pilar, Registro } from '../types';
import { addDias, diaSemana, diasDaSemana, hoje, inicioSemana } from './datas';
import { valorSugerido } from './agenda';

/** Início da janela de eventos carregados do Google Agenda */
export function inicioJanelaAgenda(): string {
  return addDias(inicioSemana(hoje()), -35);
}

/**
 * O que estava planejado para os dias informados.
 * - Agenda conectada: eventos "[Tag]" do Google Agenda
 * - Sem Agenda: dias_planejados de cada categoria (plano semanal fixo)
 */
export function itensPlanejados(
  dias: string[],
  categorias: Categoria[],
  eventos: EventoAgenda[],
  agendaConectada: boolean
): ItemPlanejado[] {
  const agora = new Date();
  const h = hoje();
  const janela = inicioJanelaAgenda();
  const itens: ItemPlanejado[] = [];
  const setDias = new Set(dias);

  if (agendaConectada && eventos.length > 0) {
    for (const ev of eventos) {
      if (!setDias.has(ev.data) || ev.data < janela) continue;
      const cat = categorias.find((c) => c.id === ev.categoria_id);
      itens.push({
        ref_id: ev.ref_id,
        origem: 'agenda',
        data: ev.data,
        hora: ev.hora,
        titulo: ev.titulo,
        categoria_id: ev.categoria_id,
        tag: ev.tag,
        valor_sugerido: valorSugerido(ev, cat),
        terminou: ev.dia_inteiro ? ev.data < h : new Date(ev.fim) <= agora
      });
    }
  }
  return itens.sort((a, b) => (a.data + (a.hora || '99')).localeCompare(b.data + (b.hora || '99')));
}

export function contaComoFeito(r: Registro) {
  return r.status === 'feito' || r.status === 'parcial';
}

// ---------------- Estatísticas semanais ----------------

export interface StatCategoria {
  categoria: Categoria;
  sessoes: number;
  volume: number;
  pctSessoes: number | null;
  pctVolume: number | null;
  pct: number | null; // média das metas definidas, cada uma limitada a 100%
  planejados: number;
  falhas: Registro[];
  parciais: Registro[];
}

export interface StatPilar {
  pilar: Pilar;
  categorias: StatCategoria[];
  pct: number | null;
}

export interface Aderencia {
  planejados: number; // respondidos + pendentes (exclui remarcados)
  feitos: number;
  parciais: number;
  naoFeitos: number;
  remarcados: number;
  pendentes: number; // já passou e ainda sem resposta
  futuros: number;
  pct: number | null; // (feitos + 0,5*parciais) / respondidos
}

export interface StatSemana {
  inicio: string;
  fim: string;
  dias: string[];
  registros: Registro[];
  pilares: StatPilar[];
  score: number | null;
  aderencia: Aderencia;
  motivos: Record<string, number>;
  foraDaAgenda: Registro[];
  pendentes: ItemPlanejado[];
}

function limitar(v: number) {
  return Math.min(1, Math.max(0, v));
}

export function calcularSemana(
  inicio: string,
  pilares: Pilar[],
  categorias: Categoria[],
  registros: Registro[],
  eventos: EventoAgenda[],
  agendaConectada: boolean
): StatSemana {
  const dias = diasDaSemana(inicio);
  const fim = dias[6];
  const regs = registros.filter((r) => r.data >= inicio && r.data <= fim);
  const planejados = itensPlanejados(dias, categorias, eventos, agendaConectada);
  const porRef = new Map(regs.filter((r) => r.ref_id).map((r) => [r.ref_id!, r]));

  // ----- Aderência -----
  const refsPlanejadas = new Set(planejados.map((p) => p.ref_id));
  // registros de itens planejados que não estão mais visíveis (semanas antigas) também contam
  const regsPlanejadosExtras = regs.filter((r) => r.origem !== 'manual' && r.ref_id && !refsPlanejadas.has(r.ref_id));
  const ad: Aderencia = { planejados: 0, feitos: 0, parciais: 0, naoFeitos: 0, remarcados: 0, pendentes: 0, futuros: 0, pct: null };
  const pendentes: ItemPlanejado[] = [];

  const contar = (r: Registro | undefined, item?: ItemPlanejado) => {
    if (!r) {
      if (item && item.terminou) {
        if (item.categoria_id && item.categoria_id !== 'cat_geral') {
          ad.pendentes++;
          pendentes.push(item);
        }
      } else ad.futuros++;
      return;
    }
    if (r.status === 'ignorado') return;
    if (r.status === 'feito') ad.feitos++;
    else if (r.status === 'parcial') ad.parciais++;
    else if (r.status === 'nao_feito') ad.naoFeitos++;
    else ad.remarcados++;
  };
  planejados.forEach((p) => contar(porRef.get(p.ref_id), p));
  regsPlanejadosExtras.forEach((r) => contar(r));
  const respondidos = ad.feitos + ad.parciais + ad.naoFeitos;
  ad.planejados = respondidos + ad.pendentes;
  ad.pct = respondidos > 0 ? (ad.feitos + ad.parciais * 0.5) / respondidos : null;

  // ----- Por categoria / pilar -----
  const statsPilares: StatPilar[] = [...pilares]
    .sort((a, b) => a.numero - b.numero)
    .map((pilar) => {
      const cats = categorias.filter((c) => c.pilar_id === pilar.id && !c.inativa);
      const statsCats: StatCategoria[] = cats.map((c) => {
        const rc = regs.filter((r) => r.categoria_id === c.id);
        const feitos = rc.filter(contaComoFeito);
        const sessoes = feitos.length;
        const volume = Math.round(feitos.reduce((s, r) => s + (Number(r.valor) || 0), 0) * 100) / 100;
        const pctSessoes = c.meta_semanal_sessoes > 0 ? sessoes / c.meta_semanal_sessoes : null;
        const pctVolume = c.meta_semanal_volume > 0 ? volume / c.meta_semanal_volume : null;
        const partes = [pctSessoes, pctVolume].filter((v): v is number => v !== null).map(limitar);
        return {
          categoria: c,
          sessoes,
          volume,
          pctSessoes,
          pctVolume,
          pct: partes.length ? partes.reduce((a, b) => a + b, 0) / partes.length : null,
          planejados: planejados.filter((p) => p.categoria_id === c.id).length,
          falhas: rc.filter((r) => r.status === 'nao_feito'),
          parciais: rc.filter((r) => r.status === 'parcial')
        };
      });
      const comMeta = statsCats.filter((s) => s.pct !== null);
      return {
        pilar,
        categorias: statsCats,
        pct: comMeta.length ? comMeta.reduce((a, s) => a + (s.pct as number), 0) / comMeta.length : null
      };
    });

  const comPeso = statsPilares.filter((p) => p.pct !== null && p.pilar.peso_no_score_geral > 0);
  const somaPesos = comPeso.reduce((a, p) => a + p.pilar.peso_no_score_geral, 0);
  const score =
    somaPesos > 0
      ? Math.round((comPeso.reduce((a, p) => a + (p.pct as number) * p.pilar.peso_no_score_geral, 0) / somaPesos) * 100)
      : null;

  const motivos: Record<string, number> = {};
  regs
    .filter((r) => r.status === 'nao_feito')
    .forEach((r) => {
      const m = r.motivo || 'Sem motivo';
      motivos[m] = (motivos[m] || 0) + 1;
    });

  return {
    inicio,
    fim,
    dias,
    registros: regs,
    pilares: statsPilares,
    score,
    aderencia: ad,
    motivos,
    foraDaAgenda: regs.filter((r) => r.origem === 'manual' && contaComoFeito(r)),
    pendentes
  };
}

export function formatarNumero(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(n < 10 ? 1 : 0).replace('.', ',');
}

export function pct(n: number | null): string {
  return n === null ? '—' : `${Math.round(n * 100)}%`;
}
