import { useCallback, useEffect, useRef, useState } from 'react';

// ------------------------------------------------------------
// Cliente da API (Cloudflare Worker -> Firestore)
// Estratégia: localStorage é a fonte imediata (offline-first);
// a nuvem é sincronizada bidirecionalmente em tempo real.
// ------------------------------------------------------------

export function getApiBase(): string {
  return (localStorage.getItem('ROTINA_API_URL') || import.meta.env.VITE_API_URL || '')
    .trim()
    .replace(/\/$/, '');
}

export function getApiSecret(): string {
  return (
    localStorage.getItem('API_SECRET_KEY') ||
    import.meta.env.VITE_API_SECRET_KEY ||
    'rotina_sec_samuel_2026'
  ).trim();
}

export function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const base = getApiBase();
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers = new Headers(options.headers || {});
  const token = getApiSecret();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.method && options.method !== 'GET') headers.set('Content-Type', 'application/json');
  return fetch(url, { ...options, headers });
}

export type StatusSync = 'carregando' | 'online' | 'offline';

function lerLocal<T>(chave: string, padrao: T): T {
  try {
    const raw = localStorage.getItem(chave);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* ignora */
  }
  return padrao;
}

/**
 * Coleção sincronizada bidirecionalmente (localStorage + Cloudflare Worker/Firestore).
 * - Une itens remotos com itens criados localmente (sem perda de dados entre celular e PC).
 * - Sobe automaticamente qualquer item pendente local para a nuvem.
 * - Sincroniza em background a cada 15s e ao focar a aba.
 */
export function useColecao<T extends { id: string }>(colecao: string, iniciais: T[] = []) {
  const chave = `rotina2_${colecao}`;
  const [itens, setItens] = useState<T[]>(() => lerLocal<T[]>(chave, iniciais));
  const [status, setStatus] = useState<StatusSync>('carregando');
  const itensRef = useRef(itens);
  itensRef.current = itens;

  useEffect(() => {
    localStorage.setItem(chave, JSON.stringify(itens));
  }, [chave, itens]);

  const carregar = useCallback(async () => {
    if (!getApiBase()) {
      setStatus('offline');
      return;
    }
    try {
      const res = await apiFetch(`/api/${colecao}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const remotos = (await res.json()) as T[];
      setStatus('online');

      if (Array.isArray(remotos)) {
        if (remotos.length === 0 && itensRef.current.length > 0) {
          // Nuvem vazia: semeia itens locais existentes
          await Promise.all(
            itensRef.current.map((it) =>
              apiFetch(`/api/${colecao}/${encodeURIComponent(it.id)}`, {
                method: 'PUT',
                body: JSON.stringify(it)
              })
            )
          );
        } else {
          // Merge inteligente: combina dados da nuvem com registros locais
          const mapa = new Map<string, T>();
          // 1. Itens locais primeiro
          itensRef.current.forEach((it) => mapa.set(it.id, it));
          // 2. Itens remotos sobrepõem/adicionam (nuvem é a autoridade)
          remotos.forEach(({ atualizado_em, ...r }: any) => mapa.set(r.id, r as T));
          const unificados = Array.from(mapa.values());
          setItens(unificados);

          // 3. Se existiam itens locais que ainda NÃO subiram para a nuvem, sobe agora!
          const idsRemotos = new Set(remotos.map((r: any) => r.id));
          const pendentes = itensRef.current.filter((it) => !idsRemotos.has(it.id));
          if (pendentes.length > 0) {
            Promise.all(
              pendentes.map((it) =>
                apiFetch(`/api/${colecao}/${encodeURIComponent(it.id)}`, {
                  method: 'PUT',
                  body: JSON.stringify(it)
                })
              )
            ).catch(console.error);
          }
        }
      }
    } catch {
      setStatus('offline');
    }
  }, [colecao]);

  // Polling ativo a cada 15s + ao focar/retornar à aba
  useEffect(() => {
    carregar();
    const onFocus = () => carregar();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') carregar();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    const interval = setInterval(carregar, 15000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, [carregar]);

  const salvar = useCallback(
    async (item: T) => {
      // 1. Atualiza o estado local imediatamente (sem travamentos na UI)
      setItens((prev) => {
        const idx = prev.findIndex((p) => p.id === item.id);
        if (idx < 0) return [...prev, item];
        const copia = [...prev];
        copia[idx] = item;
        return copia;
      });

      // 2. Persiste na nuvem Cloudflare Worker / Firestore
      if (getApiBase()) {
        try {
          const res = await apiFetch(`/api/${colecao}/${encodeURIComponent(item.id)}`, {
            method: 'PUT',
            body: JSON.stringify(item)
          });
          if (res.ok) {
            setStatus('online');
          } else {
            console.warn(`[Sync] Falha ao salvar ${colecao}/${item.id}: status ${res.status}`);
            setStatus('offline');
          }
        } catch (err) {
          console.warn(`[Sync] Erro de rede ao salvar ${colecao}/${item.id}:`, err);
          setStatus('offline');
        }
      }
    },
    [colecao]
  );

  const remover = useCallback(
    async (id: string) => {
      setItens((prev) => prev.filter((p) => p.id !== id));
      if (getApiBase()) {
        try {
          const res = await apiFetch(`/api/${colecao}/${encodeURIComponent(id)}`, {
            method: 'DELETE'
          });
          if (res.ok) setStatus('online');
        } catch {
          setStatus('offline');
        }
      }
    },
    [colecao]
  );

  return { itens, salvar, remover, status, recarregar: carregar };
}
