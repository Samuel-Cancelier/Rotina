import { FirestoreClient, Env } from './firestore';
import { handleTelegramWebhook } from './telegram';

// Cabeçalhos CORS para permitir requisições do Frontend React
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders
  });
}

const PILARES_PADRAO = [
  {
    id: 'pilar_atividade_fisica',
    numero: 1,
    nome: 'Atividade Física',
    meta_pontos_mensal: 60,
    peso_no_score_geral: 30,
    tem_meta: true,
    cor: '#10b981'
  },
  {
    id: 'pilar_estudos',
    numero: 2,
    nome: 'Estudos e Leitura',
    meta_pontos_mensal: 50,
    peso_no_score_geral: 25,
    tem_meta: true,
    cor: '#3b82f6'
  },
  {
    id: 'pilar_trabalho',
    numero: 3,
    nome: 'Trabalho',
    meta_pontos_mensal: 80,
    peso_no_score_geral: 30,
    tem_meta: true,
    cor: '#6c2efe'
  },
  {
    id: 'pilar_domesticas',
    numero: 4,
    nome: 'Tarefas Domésticas',
    meta_pontos_mensal: 30,
    peso_no_score_geral: 15,
    tem_meta: true,
    cor: '#f59e0b'
  },
  {
    id: 'pilar_diversos',
    numero: 5,
    nome: 'Diversos (sem meta)',
    meta_pontos_mensal: 0,
    peso_no_score_geral: 0,
    tem_meta: false,
    cor: '#64748b'
  }
];

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Responde Preflight CORS
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Autenticação da API (Proteção do Painel Web)
    const apiSecret = env.API_SECRET_KEY;
    if (apiSecret && path.startsWith('/api/')) {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || authHeader !== `Bearer ${apiSecret}`) {
        return new Response(JSON.stringify({ erro: 'Não autorizado. Forneça o token correto.' }), {
          status: 401,
          headers: corsHeaders
        });
      }
    }

    const db = new FirestoreClient(env);

    try {
      // -------------------------------------------------------------
      // 1. HEALTHCHECK E DEBUG
      // -------------------------------------------------------------
      if (path === '/' && method === 'GET') {
        const pk = env.FIREBASE_PRIVATE_KEY || '';
        let clean = pk.replace(/[^A-Za-z0-9+/]/g, '');
        while (clean.length % 4 !== 0) { clean += '='; }
        let atobSuccess = false;
        let atobError = '';
        try {
          atob(clean);
          atobSuccess = true;
        } catch (e: any) {
          atobError = e.message;
        }

        return jsonResponse({
          status: 'online',
          servico: 'Telegram Bot & API Rotina e Metas',
          chave_configurada: pk ? true : false,
          tamanho_original: pk.length,
          tamanho_limpo: clean.length,
          comeca_com: pk.substring(0, 30),
          termina_com: pk.substring(pk.length - 30),
          atob_sucesso: atobSuccess,
          atob_erro: atobError
        });
      }

      // -------------------------------------------------------------
      // 2. WEBHOOK DO TELEGRAM
      // -------------------------------------------------------------
      if (path === '/webhook' && method === 'POST') {
        const update = (await request.json()) as any;
        // Processa o webhook em background no Worker
        ctx.waitUntil(handleTelegramWebhook(update, env));
        return new Response('OK', { status: 200 });
      }

      // -------------------------------------------------------------
      // 3. REGISTRAR WEBHOOK E COMANDOS NO TELEGRAM
      // -------------------------------------------------------------
      if (path === '/set_webhook') {
        const webhookUrl = `${url.origin}/webhook`;
        const tgRes = await fetch(
          `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
        );
        const tgData = await tgRes.json();
        
        // Configurar os comandos no menu do Telegram
        const commands = [
           { command: "agenda", description: "Ver agendamentos pendentes para hoje" },
           { command: "rotina", description: "Agendar uma rotina (Atividade cadastrada)" },
           { command: "agendar", description: "Criar um agendamento rápido/pontual" },
           { command: "agendamentos", description: "Ver todos os agendamentos pendentes" },
           { command: "feito", description: "Lançar atividade concluída manualmente" },
           { command: "pilares", description: "Ver resumo e progresso dos Pilares" },
           { command: "score", description: "Ver o Score Geral deste mês" },
           { command: "categorias", description: "Ver todas categorias e metas" },
           { command: "atividades", description: "Ver todas atividades cadastradas" }
        ];
        
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setMyCommands`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ commands })
        });
        
        return jsonResponse({
          webhook_configurado: webhookUrl,
          telegram_response: tgData,
          comandos_atualizados: true
        });
      }

      // -------------------------------------------------------------
      // 4. API: PILARES
      // -------------------------------------------------------------
      if (path === '/api/pilares') {
        if (method === 'GET') {
          let pilares = await db.listDocuments('pilares').catch(() => []);
          if (!pilares || pilares.length === 0) {
            pilares = PILARES_PADRAO;
          }
          pilares.sort((a: any, b: any) => (a.numero || 0) - (b.numero || 0));
          return jsonResponse(pilares);
        }
      }

      if (path.startsWith('/api/pilares/') && method === 'PUT') {
        const id = path.replace('/api/pilares/', '');
        const body = (await request.json()) as Record<string, any>;
        const saved = await db.setDocument('pilares', id, body);
        return jsonResponse({ status: 'sucesso', pilar: saved });
      }

      // -------------------------------------------------------------
      // 5. API: CATEGORIAS
      // -------------------------------------------------------------
      if (path === '/api/categorias') {
        if (method === 'GET') {
          const categorias = await db.listDocuments('categorias');
          categorias.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
          return jsonResponse(categorias);
        }

        if (method === 'POST') {
          const body: any = await request.json();
          if (!body.nome) return jsonResponse({ erro: 'Nome é obrigatório' }, 400);

          const saved = await db.addDocument('categorias', {
            nome: body.nome.trim(),
            unidade_padrao: body.unidade_padrao || 'un',
            pilar_id: body.pilar_id || 'pilar_atividade_fisica',
            pontos_por_unidade: Number(body.pontos_por_unidade) || 1,
            meta_mensal: Number(body.meta_mensal) || 0,
            cor: body.cor || '#10b981',
            criado_em: new Date().toISOString()
          });
          return jsonResponse({ status: 'criado', id: saved.id }, 201);
        }
      }

      if (path.startsWith('/api/categorias/')) {
        const id = path.replace('/api/categorias/', '');
        if (method === 'PUT') {
          const body = (await request.json()) as Record<string, any>;
          const saved = await db.setDocument('categorias', id, body);
          return jsonResponse({ status: 'sucesso', categoria: saved });
        }
        if (method === 'DELETE') {
          await db.deleteDocument('categorias', id);
          return jsonResponse({ status: 'excluido', id });
        }
      }

      // -------------------------------------------------------------
      // 6. API: ATIVIDADES
      // -------------------------------------------------------------
      if (path === '/api/atividades') {
        if (method === 'GET') {
          const atividades = await db.listDocuments('atividades_cadastradas');
          atividades.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
          return jsonResponse(atividades);
        }

        if (method === 'POST') {
          const body = (await request.json()) as Record<string, any>;
          if (!body.nome || !body.categoria_id) {
            return jsonResponse({ erro: 'Nome e categoria_id são obrigatórios' }, 400);
          }

          const saved = await db.addDocument('atividades_cadastradas', {
            nome: String(body.nome).trim(),
            categoria_id: body.categoria_id,
            pilar_id: body.pilar_id,
            recorrente: Boolean(body.recorrente ?? true),
            unidade: body.unidade || '',
            afeta_meta: Boolean(body.afeta_meta ?? true),
            criado_em: new Date().toISOString()
          });
          return jsonResponse({ status: 'criado', id: saved.id }, 201);
        }
      }

      if (path.startsWith('/api/atividades/')) {
        const id = path.replace('/api/atividades/', '');
        if (method === 'PUT') {
          const body = (await request.json()) as Record<string, any>;
          const saved = await db.setDocument('atividades_cadastradas', id, body);
          return jsonResponse({ status: 'sucesso', atividade: saved });
        }
        if (method === 'DELETE') {
          await db.deleteDocument('atividades_cadastradas', id);
          return jsonResponse({ status: 'excluido', id });
        }
      }

      // -------------------------------------------------------------
      // 7. API: REGISTROS MENSAIS
      // -------------------------------------------------------------
      if (path === '/api/registros_mensais' && method === 'GET') {
        const registros = await db.listDocuments('registros_mensais');
        return jsonResponse(registros);
      }

      // -------------------------------------------------------------
      // 8. API: AGENDAMENTOS
      // -------------------------------------------------------------
      if (path === '/api/agendamentos') {
        if (method === 'GET') {
          const agendamentos = await db.listDocuments('agendamentos');
          return jsonResponse(agendamentos);
        }

        if (method === 'POST') {
          const body = (await request.json()) as Record<string, any>;
          const saved = await db.addDocument('agendamentos', {
            ...body,
            criado_em: new Date().toISOString()
          });
          return jsonResponse({ status: 'criado', id: saved.id }, 201);
        }
      }

      if (path.startsWith('/api/agendamentos/')) {
        const id = path.replace('/api/agendamentos/', '');
        if (method === 'PUT') {
          const body = (await request.json()) as Record<string, any>;
          const saved = await db.setDocument('agendamentos', id, body);
          return jsonResponse({ status: 'sucesso', agendamento: saved });
        }
        if (method === 'DELETE') {
          await db.deleteDocument('agendamentos', id);
          return jsonResponse({ status: 'excluido', id });
        }
      }

      // -------------------------------------------------------------
      // 9. API: HISTÓRICO E LANÇAMENTOS RAPIDOS
      // -------------------------------------------------------------
      if (path === '/api/historico_atividades') {
        if (method === 'GET') {
          const historico = await db.listDocuments('historico_atividades');
          historico.sort((a, b) => new Date(b.data_registro || 0).getTime() - new Date(a.data_registro || 0).getTime());
          return jsonResponse(historico);
        }
        
        if (method === 'POST') {
          const body = (await request.json()) as Record<string, any>;
          const { categoria_id, atividade_nome, valor } = body;
          
          if (!categoria_id || !atividade_nome || valor === undefined) {
             return jsonResponse({ erro: 'categoria_id, atividade_nome e valor sao obrigatorios' }, 400);
          }

          const cat = await db.getDocument('categorias', categoria_id);
          if (!cat) return jsonResponse({ erro: 'Categoria nao encontrada' }, 404);

          const now = new Date();
          const ano = body.ano || now.getFullYear();
          const mes = body.mes || (now.getMonth() + 1);

          const saved = await db.addDocument('historico_atividades', {
            categoria_id: cat.id,
            categoria_nome: cat.nome,
            atividade_nome: atividade_nome,
            valor: Number(valor),
            unidade: cat.unidade_padrao || 'un',
            pontos_gerados: Number(valor) * (cat.pontos_por_unidade || 1),
            data_registro: now.toISOString(),
            ano: ano,
            mes: mes
          });

          // Atualiza registros mensais
          const idRegistro = `reg_${ano}_${String(mes).padStart(2, '0')}_${cat.id}`;
          const registroExistente = await db.getDocument('registros_mensais', idRegistro);

          if (registroExistente) {
            const bd = registroExistente.atividades_breakdown || {};
            bd[atividade_nome] = (bd[atividade_nome] || 0) + Number(valor);
            const totalAcumulado = (registroExistente.valor_total || 0) + Number(valor);

            await db.setDocument('registros_mensais', idRegistro, {
              ...registroExistente,
              valor_total: totalAcumulado,
              atividades_breakdown: bd,
              atualizado_em: now.toISOString()
            });
          } else {
            await db.setDocument('registros_mensais', idRegistro, {
              ano,
              mes,
              categoria_id: cat.id,
              categoria_nome: cat.nome,
              pilar_id: cat.pilar_id || 'pilar_atividade_fisica',
              valor_total: Number(valor),
              unidade: cat.unidade_padrao || 'un',
              atividades_breakdown: { [atividade_nome]: Number(valor) },
              atualizado_em: now.toISOString()
            });
          }

          return jsonResponse({ status: 'criado', id: saved.id }, 201);
        }
      }

      if (path.startsWith('/api/historico_atividades/')) {
        const id = path.replace('/api/historico_atividades/', '');
        
        if (method === 'DELETE') {
          const old = await db.getDocument('historico_atividades', id);
          if (old) {
            const idRegistro = `reg_${old.ano}_${String(old.mes).padStart(2, '0')}_${old.categoria_id}`;
            const reg = await db.getDocument('registros_mensais', idRegistro);
            if (reg) {
               const bd = reg.atividades_breakdown || {};
               bd[old.atividade_nome] = Math.max(0, (bd[old.atividade_nome] || 0) - old.valor);
               const newTotal = Math.max(0, (reg.valor_total || 0) - old.valor);
               await db.setDocument('registros_mensais', idRegistro, {
                 ...reg,
                 valor_total: newTotal,
                 atividades_breakdown: bd,
                 atualizado_em: new Date().toISOString()
               });
            }
          }
          await db.deleteDocument('historico_atividades', id);
          return jsonResponse({ status: 'excluido', id });
        }
        
        if (method === 'PUT') {
          const body = (await request.json()) as Record<string, any>;
          const old = await db.getDocument('historico_atividades', id);
          if (old && body.valor !== undefined) {
             const diff = Number(body.valor) - old.valor;
             const idRegistro = `reg_${old.ano}_${String(old.mes).padStart(2, '0')}_${old.categoria_id}`;
             const reg = await db.getDocument('registros_mensais', idRegistro);
             if (reg) {
                const bd = reg.atividades_breakdown || {};
                bd[old.atividade_nome] = Math.max(0, (bd[old.atividade_nome] || 0) + diff);
                const newTotal = Math.max(0, (reg.valor_total || 0) + diff);
                await db.setDocument('registros_mensais', idRegistro, {
                  ...reg,
                  valor_total: newTotal,
                  atividades_breakdown: bd,
                  atualizado_em: new Date().toISOString()
                });
             }
             const updated = await db.setDocument('historico_atividades', id, {
               ...old,
               valor: Number(body.valor),
               pontos_gerados: Number(body.valor) * (body.pontos_por_unidade || old.pontos_gerados / old.valor || 1)
             });
             return jsonResponse({ status: 'atualizado', updated });
          }
          return jsonResponse({ erro: 'Não foi possível atualizar' }, 400);
        }
      }

      return jsonResponse({ erro: 'Rota não encontrada' }, 404);
    } catch (err: any) {
      return jsonResponse({ erro: err.message || 'Erro interno no Worker' }, 500);
    }
  }
};
