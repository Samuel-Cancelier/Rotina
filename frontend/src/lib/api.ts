import { useCallback, useEffect, useRef, useState } from 'react';

// ------------------------------------------------------------
// Cliente da API (Cloudflare Worker -> Firestore)
// Estratégia: localStorage é a fonte imediata (offline-first);
// a nuvem é sincronizada em segundo plano.
// ------------------------------------------------------------

export function getApiBase(): string {
  return (localStorage.getItem('ROTINA_API_URL') || import.meta.env.VITE_API_URL || '')
    .trim()
    .replace(/\/$/, '');
}

export function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const base = getApiBase();
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem('API_SECRET_KEY');
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
 * Coleção sincronizada (localStorage + Worker).
 * - `iniciais`: semeados na nuvem se a coleção remota estiver vazia.
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
      if (!res.ok) throw new Error(String(res.status));
      const remotos = (await res.json()) as T[];
      setStatus('online');
      if (Array.isArray(remotos) && remotos.length > 0) {
        setItens(remotos.map(({ atualizado_em, ...r }: any) => r as T));
      } else if (itensRef.current.length > 0) {
        // Nuvem vazia: sobe o que existe localmente (primeiro uso / semente)
        await Promise.all(
          itensRef.current.map((it) =>
            apiFetch(`/api/${colecao}/${encodeURIComponent(it.id)}`, {
              method: 'PUT',
              body: JSON.stringify(it)
            })
          )
        );
      }
    } catch {
      setStatus('offline');
    }
  }, [colecao]);

  useEffect(() => {
    carregar();
    const onFocus = () => carregar();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [carregar]);

  const salvar = useCallback(
    (item: T) => {
      setItens((prev) => {
        const idx = prev.findIndex((p) => p.id === item.id);
        if (idx < 0) return [...prev, item];
        const copia = [...prev];
        copia[idx] = item;
        return copia;
      });
      if (getApiBase()) {
        apiFetch(`/api/${colecao}/${encodeURIComponent(item.id)}`, {
          method: 'PUT',
          body: JSON.stringify(item)
        }).catch(() => setStatus('offline'));
      }
    },
    [colecao]
  );

  const remover = useCallback(
    (id: string) => {
      setItens((prev) => prev.filter((p) => p.id !== id));
      if (getApiBase()) {
        apiFetch(`/api/${colecao}/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() =>
          setStatus('offline')
        );
      }
    },
    [colecao]
  );

  return { itens, salvar, remover, status, recarregar: carregar };
}
