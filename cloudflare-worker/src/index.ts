import { FirestoreClient, Env } from './firestore';

/**
 * API do App Rotina (Cloudflare Worker -> Firestore).
 *
 * CRUD genérico e enxuto. Os IDs são gerados no frontend, então só existem 3 operações:
 *   GET    /api/:colecao          -> lista todos os documentos
 *   PUT    /api/:colecao/:id      -> cria ou substitui o documento
 *   DELETE /api/:colecao/:id      -> remove o documento
 */

// Coleções permitidas (prefixo "rotina_" isola o modelo v2 dos dados antigos)
const COLECOES: Record<string, string> = {
  pilares: 'rotina_pilares',
  categorias: 'rotina_categorias',
  registros: 'rotina_registros',
  objetivos: 'rotina_objetivos',
  config: 'rotina_config'
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Healthcheck
    if (path === '' || path === '/') {
      return jsonResponse({
        status: 'online',
        servico: 'API Rotina (v2)',
        chave_configurada: Boolean(env.FIREBASE_PRIVATE_KEY),
        protegida: Boolean(env.API_SECRET_KEY)
      });
    }

    // Autenticação simples por Bearer token
    if (env.API_SECRET_KEY && path.startsWith('/api/')) {
      const auth = request.headers.get('Authorization');
      if (auth !== `Bearer ${env.API_SECRET_KEY}`) {
        return jsonResponse({ erro: 'Não autorizado' }, 401);
      }
    }

    const match = path.match(/^\/api\/([a-z_]+)(?:\/([A-Za-z0-9_\-:.]+))?$/);
    if (!match) return jsonResponse({ erro: 'Rota não encontrada' }, 404);

    const colecao = COLECOES[match[1]];
    const id = match[2] ? decodeURIComponent(match[2]) : undefined;
    if (!colecao) return jsonResponse({ erro: `Coleção desconhecida: ${match[1]}` }, 404);

    const db = new FirestoreClient(env);

    try {
      if (!id && method === 'GET') {
        return jsonResponse(await db.listDocuments(colecao));
      }

      if (id && method === 'PUT') {
        const body = (await request.json()) as Record<string, any>;
        const { id: _ignorado, ...dados } = body;
        const saved = await db.setDocument(colecao, id, {
          ...dados,
          atualizado_em: new Date().toISOString()
        });
        return jsonResponse(saved);
      }

      if (id && method === 'DELETE') {
        await db.deleteDocument(colecao, id);
        return jsonResponse({ status: 'excluido', id });
      }

      return jsonResponse({ erro: 'Método não suportado' }, 405);
    } catch (err: any) {
      return jsonResponse({ erro: err.message || 'Erro interno no Worker' }, 500);
    }
  }
};
