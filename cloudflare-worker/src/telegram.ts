import { FirestoreClient, Env } from './firestore';

export async function sendTelegramMessage(botToken: string, chatId: number | string, text: string, parseMode = 'Markdown') {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode
    })
  });
}

export async function handleTelegramWebhook(update: any, env: Env) {
  const db = new FirestoreClient(env);

  // Tratamento de Botões Inline (Callback Queries)
  if (update.callback_query) {
    const callbackQuery = update.callback_query;
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data.startsWith('concluir_agendamento_')) {
       const agendId = data.replace('concluir_agendamento_', '');
       try {
         const agend = await db.getDocument('agendamentos', agendId);
         if (agend && !agend.concluido) {
            await db.setDocument('agendamentos', agendId, { ...agend, concluido: true, concluida_em: new Date().toISOString() });
            
            // Verifica se tem vinculo
            if (agend.atividade_id || agend.vinculo_atividade_id) {
               const catNomeF = (agend.categoria_nome || agend.vinculo_categoria_nome || '').split(' ')[0] || 'Categoria';
               const ativNome = agend.titulo || agend.vinculo_atividade_nome || '';
               await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `✅ *${agend.titulo}* concluída!\n\nEnvie a quantidade para a atividade vinculada no formato:\n\`/feito ${catNomeF} ${ativNome} [quantidade]\``);
            } else {
               await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `✅ Tarefa *${agend.titulo}* marcada como concluída!`);
            }
         } else {
            await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `⚠️ Tarefa já concluída ou não encontrada.`);
         }
       } catch (e: any) {
         await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `❌ Erro: ${e.message}`);
       }
    }
    
    if (data.startsWith('rotina_cat_')) {
       const catId = data.replace('rotina_cat_', '');
       try {
         const atividades = await db.listDocuments('atividades_cadastradas');
         const ativsDaCat = atividades.filter((a: any) => a.categoria_id === catId);
         
         if (ativsDaCat.length === 0) {
            await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `⚠️ Nenhuma atividade encontrada nesta categoria.`);
            return;
         }
         
         let msg = `👉 Escolha a atividade da rotina:`;
         const inline_keyboard = [];
         for (const a of ativsDaCat) {
           inline_keyboard.push([{
             text: a.nome,
             callback_data: `rotina_ativ_${a.id}`
           }]);
         }
         
         await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ chat_id: chatId, text: msg, reply_markup: { inline_keyboard } })
         });
       } catch (e: any) {
         await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `❌ Erro: ${e.message}`);
       }
    }
    
    if (data.startsWith('rotina_ativ_')) {
       const ativId = data.replace('rotina_ativ_', '');
       try {
         const atividades = await db.listDocuments('atividades_cadastradas');
         const ativ = atividades.find((a: any) => a.id === ativId);
         
         if (ativ) {
            const today = new Date().toISOString().split('T')[0];
            await db.addDocument('agendamentos', {
              tipo: 'rotina',
              titulo: ativ.nome,
              data: today,
              concluido: false,
              atividade_id: ativ.id,
              categoria_id: ativ.categoria_id,
              categoria_nome: ativ.categoria_nome,
              pilar_id: ativ.pilar_id,
              criado_em: new Date().toISOString()
            });
            await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `✅ Rotina agendada para hoje: *${ativ.nome}*`);
         }
       } catch (e: any) {
         await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `❌ Erro: ${e.message}`);
       }
    }
    return;
  }

  const message = update?.message;
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();

  // 1. /start ou /help
  if (text.startsWith('/start') || text.startsWith('/help')) {
    const welcome =
      `👋 *Bem-vindo ao Gestão de Rotina & Metas!*\n` +
      `_(Hospedado no Cloudflare Workers Edge)_\n\n` +
      `🏛️ *Pilares Soberanos:*\n` +
      `1. Atividade Física\n` +
      `2. Estudos e Leitura\n` +
      `3. Trabalho\n` +
      `4. Tarefas Domésticas\n` +
      `5. Diversos (livre)\n\n` +
      `⚡ *Comandos Rápidos:*\n` +
      `• \`/feito corrida Parque 5\` - Lança 5 km e soma pontos\n` +
      `• \`/score\` - Ver o Score Geral ponderado do mês\n` +
      `• \`/pilares\` - Ver os 5 Pilares e metas\n` +
      `• \`/categorias\` - Ver categorias quantitativas\n` +
      `• \`/atividades\` - Ver atividades cadastradas`;

    await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, welcome);
    return;
  }

  // 2. /pilares
  if (text.startsWith('/pilares')) {
    try {
      const pilares = await db.listDocuments('pilares');
      pilares.sort((a, b) => (a.numero || 0) - (b.numero || 0));

      let msg = `🏛️ *5 PILARES SOBERANOS DO SISTEMA:*\n\n`;
      for (const p of pilares) {
        msg += `*${p.numero}. ${p.nome}*\n`;
        if (p.tem_meta) {
          msg += `   🎯 Meta: \`${p.meta_pontos_mensal || 0} pts\` | Peso: \`${p.peso_no_score_geral || 0}%\`\n`;
        } else {
          msg += `   🕊️ Sem meta de pontos fixa\n`;
        }
      }
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, msg);
    } catch (e: any) {
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `⚠️ Erro ao consultar pilares: ${e.message}`);
    }
    return;
  }

  // 3. /score
  if (text.startsWith('/score')) {
    try {
      const now = new Date();
      const mesDocId = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
      const scoreDoc = await db.getDocument('scores_mensais', mesDocId);

      const scoreTotal = scoreDoc ? Math.round(scoreDoc.score_geral || 0) : 0;
      let msg =
        `📊 *SCORE GERAL DOS PILARES*\n` +
        `🗓️ Mês de Referência: \`${mesDocId}\`\n\n` +
        `🏆 *Score Geral:* \`${scoreTotal}/100 pts\`\n\n`;

      if (scoreDoc?.pilares) {
        for (const [_, p] of Object.entries<any>(scoreDoc.pilares)) {
          msg += `• *${p.nome}*: \`${Math.round(p.pontos_acumulados || 0)}/${p.meta_pontos || 0} pts\` (${Math.round(p.porcentagem_concluida || 0)}%)\n`;
        }
      } else {
        msg += `_Nenhum lançamento registrado ainda para este mês._`;
      }

      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, msg);
    } catch (e: any) {
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `⚠️ Erro ao calcular score: ${e.message}`);
    }
    return;
  }

  // 4. /feito [categoria] [atividade] [quantidade]
  if (text.startsWith('/feito')) {
    const raw = text.replace('/feito', '').trim();
    const partes = raw.split(/\s+/);

    if (partes.length < 3) {
      const ajudaFeito =
        `📋 *Como lançar uma atividade realizada:*\n\n` +
        `Envie no formato:\n` +
        `\`/feito [categoria] [atividade] [quantidade]\`\n\n` +
        `*Exemplos práticos:*\n` +
        `• \`/feito corrida Parque 5\` (5 km de corrida no Parque)\n` +
        `• \`/feito leitura Habitos 30\` (30 páginas lidas)\n` +
        `• \`/feito futsal Pelada 1.5\` (1.5 horas de jogo)`;
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, ajudaFeito);
      return;
    }

    const catInput = partes[0].toLowerCase();
    const qtdStr = partes[partes.length - 1].replace(',', '.');
    const ativNome = partes.slice(1, partes.length - 1).join(' ');
    const valor = parseFloat(qtdStr);

    if (isNaN(valor) || valor <= 0) {
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `⚠️ A quantidade deve ser um número positivo! Exemplo: \`/feito corrida Parque 5\``);
      return;
    }

    try {
      const categorias = await db.listDocuments('categorias');
      const cat = categorias.find(
        (c) => c.nome.toLowerCase().includes(catInput) || c.id.toLowerCase().includes(catInput)
      );

      if (!cat) {
        await sendTelegramMessage(
          env.TELEGRAM_BOT_TOKEN,
          chatId,
          `⚠️ Categoria "${catInput}" não encontrada. Digite \`/categorias\` para ver as disponíveis.`
        );
        return;
      }

      // Salva histórico de atividade
      const now = new Date();
      const ano = now.getFullYear();
      const mes = now.getMonth() + 1;

      await db.addDocument('historico_atividades', {
        categoria_id: cat.id,
        categoria_nome: cat.nome,
        pilar_id: cat.pilar_id,
        atividade_nome: ativNome,
        valor_unidade: valor,
        unidade: cat.unidade_padrao || 'un',
        pontos_gerados: valor * (cat.pontos_por_unidade || 1),
        data_registro: now.toISOString(),
        ano: ano,
        mes: mes
      });

      // Atualiza o registro mensal
      const idRegistro = `reg_${ano}_${String(mes).padStart(2, '0')}_${cat.id}`;
      const registroExistente = await db.getDocument('registros_mensais', idRegistro);

      let totalAcumulado = valor;
      if (registroExistente) {
        const bd = registroExistente.atividades_breakdown || {};
        bd[ativNome] = (bd[ativNome] || 0) + valor;
        totalAcumulado = (registroExistente.valor_total || 0) + valor;

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
          valor_total: valor,
          unidade: cat.unidade_padrao || 'un',
          atividades_breakdown: { [ativNome]: valor },
          atualizado_em: now.toISOString()
        });
      }

      const pontos = (valor * (cat.pontos_por_unidade || 1)).toFixed(1);
      const msgOk =
        `✅ *Lançamento concluído via Cloudflare!*\n\n` +
        `📁 *Categoria:* ${cat.nome}\n` +
        `📌 *Atividade:* ${ativNome}\n` +
        `➕ *Registrado:* \`+${valor} ${cat.unidade_padrao}\` (Total no mês: \`${totalAcumulado.toFixed(1)} ${cat.unidade_padrao}\`)\n` +
        `🌟 *Pontos gerados no Pilar:* \`+${pontos} pts\``;

      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, msgOk);
    } catch (e: any) {
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `⚠️ Falha ao salvar no Firestore: ${e.message}`);
    }
    return;
  }

  // 5. /categorias
  if (text.startsWith('/categorias')) {
    try {
      const categorias = await db.listDocuments('categorias');
      let msg = `📁 *CATEGORIAS QUANTITATIVAS:*\n\n`;
      for (const c of categorias) {
        msg += `• *${c.nome}* (\`${c.unidade_padrao}\`)\n`;
        msg += `  Meta: \`${c.meta_mensal || 0}\` | Pontos/un: \`${c.pontos_por_unidade || 1}\`\n`;
      }
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, msg);
    } catch (e: any) {
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `⚠️ Erro: ${e.message}`);
    }
    return;
  }

  // 6. /atividades
  if (text.startsWith('/atividades')) {
    try {
      const atividades = await db.listDocuments('atividades_cadastradas');
      let msg = `📌 *ATIVIDADES CADASTRADAS:*\n\n`;
      for (const a of atividades) {
        msg += `• *${a.nome}* (${a.categoria_nome || 'Sem categoria'})\n`;
      }
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, msg);
    } catch (e: any) {
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `⚠️ Erro: ${e.message}`);
    }
    return;
  }

  // 7. /agendar [tarefa]
  if (text.startsWith('/agendar')) {
    const raw = text.replace('/agendar', '').trim();
    if (!raw) {
      await sendTelegramMessage(
        env.TELEGRAM_BOT_TOKEN,
        chatId,
        `⚠️ *Como usar:*\n\n\`/agendar Reunião com equipe\`\n\n(Se quiser agendar uma rotina vinculada a uma atividade cadastrada, use /rotina)`
      );
      return;
    }
    try {
      await db.addDocument('agendamentos', {
        tipo: 'pontual',
        titulo: raw,
        data: new Date().toISOString().split('T')[0],
        concluido: false,
        vinculo_atividade_id: null,
        criado_em: new Date().toISOString()
      });
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `✅ Agendamento pontual salvo: *${raw}*`);
    } catch (e: any) {
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `❌ Erro: ${e.message}`);
    }
    return;
  }

  // 7.5 /rotina
  if (text.startsWith('/rotina')) {
    try {
      const categorias = await db.listDocuments('categorias');
      if (categorias.length === 0) {
         await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `⚠️ Nenhuma categoria cadastrada no site ainda.`);
         return;
      }
      
      let msg = `👉 De qual categoria é a rotina que você quer agendar?`;
      const inline_keyboard = [];
      for (const c of categorias) {
        inline_keyboard.push([{
          text: c.nome,
          callback_data: `rotina_cat_${c.id}`
        }]);
      }
      
      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, reply_markup: { inline_keyboard } })
      });
    } catch (e: any) {
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `❌ Erro: ${e.message}`);
    }
    return;
  }

  // 8. /agenda ou /agendamentos
  if (text.startsWith('/agenda') || text.startsWith('/agendamentos')) {
    try {
      const isAgendaHoje = text.trim() === '/agenda';
      const today = new Date().toISOString().split('T')[0];
      
      const agends = await db.listDocuments('agendamentos');
      let pendentes = agends.filter(a => !a.concluido);
      
      if (isAgendaHoje) {
         pendentes = pendentes.filter(a => a.data === today);
      }
      
      if (pendentes.length === 0) {
        await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `🎉 Nenhum agendamento pendente${isAgendaHoje ? ' para hoje' : ''}!`);
        return;
      }
      
      let msg = `📅 *Seus Agendamentos Pendentes${isAgendaHoje ? ' (Hoje)' : ''}:*\n\n`;
      const inline_keyboard = [];
      
      for (const a of pendentes) {
        msg += `• ${a.titulo}\n`;
        inline_keyboard.push([{
          text: `✅ Concluir: ${a.titulo.substring(0, 20)}`,
          callback_data: `concluir_agendamento_${a.id}`
        }]);
      }
      
      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: msg,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard }
        })
      });
    } catch (e: any) {
      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `❌ Erro: ${e.message}`);
    }
    return;
  }
}
