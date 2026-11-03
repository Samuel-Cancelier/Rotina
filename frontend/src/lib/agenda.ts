import { useCallback, useEffect, useMemo, useState } from 'react';
import { Categoria, EventoAgenda } from '../types';
import { addDias, hhmm, hoje, inicioSemana, ymd } from './datas';

// ============================================================
// Integração SOMENTE LEITURA com o Google Agenda
// (Google Identity Services, token no navegador — sem backend)
//
// Padrão de título reconhecido:  "[Tag] descrição opcional com quantidade"
//   ex.: "[Corrida] Rodagem leve 5 km"
//        "[Leitura] Sapiens — 30 páginas"
//        "[Treino] Peito + Ombro anterior"
// ============================================================

const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const CHAVE_TOKEN = 'rotina2_google_token';
const CHAVE_CLIENT_ID = 'rotina2_google_client_id';
const CHAVE_CALENDARIOS = 'rotina2_calendarios';

declare global {
  interface Window {
    google?: any;
  }
}

// ---------- Interpretação de títulos ----------

export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const RE_TAG = /^\s*\[([^\]]+)\]\s*(.*)$/;

export function extrairTag(titulo: string): { tag: string; resto: string } | null {
  const m = titulo.match(RE_TAG);
  if (!m) return null;
  return { tag: normalizar(m[1]), resto: m[2].trim() };
}

export function encontrarCategoria(tag: string, categorias: Categoria[]): Categoria | undefined {
  const t = normalizar(tag);
  return categorias.find(
    (c) =>
      !c.inativa &&
      (normalizar(c.tag) === t || normalizar(c.nome) === t || (c.aliases || []).some((a) => normalizar(a) === t))
  );
}

/** Tenta identificar a categoria por tag [Tag] ou por palavras-chave presentes no título/descrição */
export function identificarCategoria(titulo: string, descricao: string | undefined, categorias: Categoria[]): { cat: Categoria | undefined; tag: string | null; resto: string } {
  // 1. Tenta extrair [Tag] no início
  const extraido = extrairTag(titulo);
  if (extraido) {
    const cat = encontrarCategoria(extraido.tag, categorias);
    return { cat, tag: extraido.tag, resto: extraido.resto };
  }

  // 2. Se não tem colchetes, busca por correspondência de palavras no título ou descrição
  const textoNorm = normalizar(`${titulo} ${descricao || ''}`);
  for (const c of categorias) {
    if (c.inativa || c.id === 'cat_geral') continue;
    const palavras = [c.tag, c.nome, ...(c.aliases || [])].map(normalizar);
    for (const p of palavras) {
      if (p.length >= 3) {
        const regex = new RegExp(`\\b${p}\\b`, 'i');
        if (regex.test(textoNorm) || textoNorm.includes(p)) {
          return { cat: c, tag: c.tag, resto: titulo };
        }
      }
    }
  }

  // 3. Se não casou com nenhuma específica, usa Compromissos Gerais (se existir)
  const catGeral = categorias.find((c) => c.id === 'cat_geral');
  return { cat: catGeral, tag: null, resto: titulo };
}

const RE_QTD = /(\d+(?:[.,]\d+)?)\s*(km|p[áa]ginas?|p[áa]gs?\.?|min(?:utos)?|h(?:oras?)?)(?![a-z])/i;

function unidadeCanonica(u: string): string {
  const n = normalizar(u).replace('.', '');
  if (n === 'km') return 'km';
  if (n.startsWith('pag')) return 'paginas';
  if (n.startsWith('min')) return 'min';
  if (n.startsWith('h')) return 'h';
  return n;
}

/** Extrai "5 km", "30 páginas", "45 min", "2h" do texto e converte para a unidade da categoria */
export function extrairValor(texto: string, unidadeCategoria: string): number | null {
  const m = texto.match(RE_QTD);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  const de = unidadeCanonica(m[2]);
  const para = unidadeCanonica(unidadeCategoria);
  if (de === para) return n;
  if (de === 'min' && para === 'h') return Math.round((n / 60) * 100) / 100;
  if (de === 'h' && para === 'min') return n * 60;
  return null;
}

/** Quantidade sugerida no check-in para um evento */
export function valorSugerido(ev: EventoAgenda, cat?: Categoria): number {
  if (!cat) return 1;
  if (ev.valor_planejado != null) return ev.valor_planejado;
  const u = unidadeCanonica(cat.unidade);
  if (u === 'sessoes') return 1;
  if (!ev.dia_inteiro && (u === 'min' || u === 'h')) {
    const minutos = (new Date(ev.fim).getTime() - new Date(ev.inicio).getTime()) / 60000;
    if (minutos > 0) return u === 'min' ? Math.round(minutos) : Math.round((minutos / 60) * 100) / 100;
  }
  return cat.valor_padrao;
}

// ---------- Token / OAuth ----------

export function getClientId(): string {
  return (localStorage.getItem(CHAVE_CLIENT_ID) || import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
}

export function setClientId(id: string) {
  if (id.trim()) localStorage.setItem(CHAVE_CLIENT_ID, id.trim());
  else localStorage.removeItem(CHAVE_CLIENT_ID);
}

function tokenSalvo(): string | null {
  try {
    const t = JSON.parse(localStorage.getItem(CHAVE_TOKEN) || 'null');
    if (t && t.access_token && t.expira > Date.now()) return t.access_token;
  } catch {
    /* ignora */
  }
  return null;
}

let gisPromise: Promise<void> | null = null;
function carregarGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gisPromise = null;
      reject(new Error('Não foi possível carregar o Google Identity Services'));
    };
    document.head.appendChild(s);
  });
  return gisPromise;
}

async function solicitarToken(): Promise<string> {
  const clientId = getClientId();
  if (!clientId) throw new Error('Configure o Google Client ID em Configurar → Google Agenda.');
  await carregarGis();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp: any) => {
        if (resp.error) return reject(new Error(resp.error_description || resp.error));
        localStorage.setItem(
          CHAVE_TOKEN,
          JSON.stringify({ access_token: resp.access_token, expira: Date.now() + (Number(resp.expires_in) - 60) * 1000 })
        );
        localStorage.setItem('rotina2_google_ja_conectou', '1');
        resolve(resp.access_token);
      },
      error_callback: (err: any) => reject(new Error(err?.message || err?.type || 'Login cancelado'))
    });
    client.requestAccessToken();
  });
}

class ErroAuth extends Error {}

async function gget(token: string, path: string, params: Record<string, string> = {}): Promise<any> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 401) {
    localStorage.removeItem(CHAVE_TOKEN);
    throw new ErroAuth('Sessão do Google expirou. Clique em "Reconectar Google".');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `Erro ${res.status} na API do Google Agenda`);
  }
  return res.json();
}

export interface CalendarioGoogle {
  id: string;
  nome: string;
  primario: boolean;
  cor?: string;
}

interface EventoBruto {
  id: string;
  calendario_id: string;
  titulo: string;
  descricao?: string;
  inicio: string;
  fim: string;
  dia_inteiro: boolean;
}

// ---------- Hook principal ----------

export interface EstadoAgenda {
  clientIdConfigurado: boolean;
  conectado: boolean;
  jaConectou: boolean;
  carregando: boolean;
  erro: string | null;
  calendarios: CalendarioGoogle[];
  selecionados: string[];
  eventos: EventoAgenda[]; // somente eventos com [Tag]
  atualizadoEm: Date | null;
}

export function useAgenda(categorias: Categoria[], nomeCalendario: string) {
  const [token, setToken] = useState<string | null>(() => tokenSalvo());
  const [calendarios, setCalendarios] = useState<CalendarioGoogle[]>([]);
  const [selecionados, setSelecionadosState] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_CALENDARIOS) || '[]');
    } catch {
      return [];
    }
  });
  const [brutos, setBrutos] = useState<EventoBruto[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [clientIdVersao, setClientIdVersao] = useState(0);

  const setSelecionados = useCallback((ids: string[]) => {
    localStorage.setItem(CHAVE_CALENDARIOS, JSON.stringify(ids));
    setSelecionadosState(ids);
  }, []);

  const carregar = useCallback(
    async (tk: string) => {
      setCarregando(true);
      setErro(null);
      try {
        const lista = await gget(tk, '/users/me/calendarList', { maxResults: '250' });
        const cals: CalendarioGoogle[] = (lista.items || []).map((c: any) => ({
          id: c.id,
          nome: c.summaryOverride || c.summary,
          primario: Boolean(c.primary),
          cor: c.backgroundColor
        }));
        setCalendarios(cals);

        let ids = selecionados.filter((id) => cals.some((c) => c.id === id));
        if (ids.length === 0) {
          // Padrão: lê TODOS os calendários da conta pessoal do Google
          ids = cals.map((c) => c.id);
          setSelecionados(ids);
        }

        // Janela: 5 semanas para trás (relatórios) até 8 dias à frente
        const timeMin = new Date(addDias(inicioSemana(hoje()), -35) + 'T00:00:00').toISOString();
        const timeMax = new Date(addDias(hoje(), 8) + 'T23:59:59').toISOString();

        const resultados = await Promise.all(
          ids.map(async (calId) => {
            const itens: any[] = [];
            let pageToken = '';
            do {
              const params: Record<string, string> = {
                singleEvents: 'true',
                orderBy: 'startTime',
                timeMin,
                timeMax,
                maxResults: '2500'
              };
              if (pageToken) params.pageToken = pageToken;
              const r = await gget(tk, `/calendars/${encodeURIComponent(calId)}/events`, params);
              itens.push(...(r.items || []));
              pageToken = r.nextPageToken || '';
            } while (pageToken);
            return itens
              .filter((e) => e.status !== 'cancelled' && e.summary)
              .map(
                (e): EventoBruto => ({
                  id: e.id,
                  calendario_id: calId,
                  titulo: e.summary,
                  descricao: e.description,
                  inicio: e.start?.dateTime || `${e.start?.date}T00:00:00`,
                  fim: e.end?.dateTime || `${e.end?.date}T00:00:00`,
                  dia_inteiro: !e.start?.dateTime
                })
              );
          })
        );
        setBrutos(resultados.flat());
        setAtualizadoEm(new Date());
      } catch (e: any) {
        if (e instanceof ErroAuth) setToken(null);
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nomeCalendario, selecionados.join('|')]
  );

  useEffect(() => {
    if (token) carregar(token);
  }, [token, carregar]);

  const conectar = useCallback(async () => {
    setErro(null);
    try {
      const tk = await solicitarToken();
      setToken(tk);
    } catch (e: any) {
      setErro(e.message);
    }
  }, []);

  const desconectar = useCallback(() => {
    const tk = token;
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem('rotina2_google_ja_conectou');
    setToken(null);
    setBrutos([]);
    setCalendarios([]);
    if (tk && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(tk, () => {});
  }, [token]);

  const recarregar = useCallback(() => {
    const tk = tokenSalvo();
    if (tk) carregar(tk);
    else setToken(null);
  }, [carregar]);

  // Interpreta TODOS os eventos da Google Agenda -> categorias
  const eventos = useMemo<EventoAgenda[]>(() => {
    const vistos = new Set<string>();
    const lista: EventoAgenda[] = [];
    for (const b of brutos) {
      const chave = `${b.id}`;
      if (vistos.has(chave)) continue; // mesmo evento em dois calendários
      vistos.add(chave);

      // Identifica categoria por [Tag] ou por termos chave no título/descrição
      const { cat, tag, resto } = identificarCategoria(b.titulo, b.descricao, categorias);
      const ini = new Date(b.inicio);
      const ev: EventoAgenda = {
        ref_id: `gcal:${b.id}`,
        calendario_id: b.calendario_id,
        titulo: b.titulo,
        tag: tag,
        categoria_id: cat?.id || 'cat_geral',
        data: b.dia_inteiro ? b.inicio.slice(0, 10) : ymd(ini),
        hora: b.dia_inteiro ? undefined : hhmm(ini),
        inicio: b.inicio,
        fim: b.fim,
        dia_inteiro: b.dia_inteiro,
        valor_planejado: cat ? extrairValor(`${resto} ${b.descricao || ''}`, cat.unidade) : null,
        descricao: b.descricao
      };
      lista.push(ev);
    }
    return lista.sort((a, b) => a.inicio.localeCompare(b.inicio));
  }, [brutos, categorias]);

  const estado: EstadoAgenda = {
    clientIdConfigurado: Boolean(getClientId()),
    conectado: Boolean(token),
    jaConectou: localStorage.getItem('rotina2_google_ja_conectou') === '1',
    carregando,
    erro,
    calendarios,
    selecionados,
    eventos,
    atualizadoEm
  };

  return {
    ...estado,
    conectar,
    desconectar,
    recarregar,
    setSelecionados,
    atualizarClientId: (id: string) => {
      setClientId(id);
      setClientIdVersao(clientIdVersao + 1);
    }
  };
}

export type AgendaApi = ReturnType<typeof useAgenda>;
