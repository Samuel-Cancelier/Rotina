import { Categoria, ConfigGeral, EventoAgenda, Objetivo, Pilar, Registro } from '../types';
import { DIAS_CURTOS, DIAS_LONGOS, addDias, ddmm, diaSemana, rotuloDia } from './datas';
import { StatSemana, calcularSemana, contaComoFeito, formatarNumero, pct } from './metricas';

const STATUS_TXT: Record<string, string> = {
  feito: '✅ feito',
  parcial: '🟡 parcial',
  nao_feito: '❌ não feito',
  remarcado: '↪️ remarcado',
  ignorado: '👁️ ignorado'
};

function statusTexto(status?: string): string {
  if (!status) return '';
  return STATUS_TXT[status] || status;
}

function statusIcone(status?: string): string {
  if (!status) return '•';
  const txt = STATUS_TXT[status];
  return txt ? txt.split(' ')[0] : '•';
}

function nomeCat(categorias: Categoria[], id: string) {
  return categorias.find((c) => c.id === id)?.nome || id;
}

function linhaMeta(atual: number, meta: number, unidade: string) {
  return `${formatarNumero(atual)}/${formatarNumero(meta)} ${unidade}`;
}

function iconePct(p: number | null) {
  if (p === null) return '';
  if (p >= 1) return ' ✅';
  if (p >= 0.6) return ' 🟡';
  return ' ❌';
}

export interface ParamsRelatorio {
  inicio: string;
  pilares: Pilar[];
  categorias: Categoria[];
  registros: Registro[];
  eventos: EventoAgenda[];
  agendaConectada: boolean;
  objetivos: Objetivo[];
  config: ConfigGeral;
  incluirContexto: boolean;
}

/** Relatório semanal em Markdown, pensado para ser colado no Gemini */
export function gerarRelatorioSemanal(p: ParamsRelatorio): string {
  const calc = (ini: string) =>
    calcularSemana(ini, p.pilares, p.categorias, p.registros, p.eventos, p.agendaConectada);
  const s = calc(p.inicio);
  const anterior = calc(addDias(p.inicio, -7));
  const historico: StatSemana[] = [3, 2, 1].map((k) => calc(addDias(p.inicio, -7 * k)));
  const L: string[] = [];

  L.push(`# Relatório Semanal de Rotina — ${ddmm(s.inicio)} a ${ddmm(s.fim)}/${s.fim.slice(0, 4)}`);
  L.push('');
  L.push(
    '> Gerado pelo App Rotina. Dados vêm do meu check-in diário dos eventos "[Tag]" do Google Agenda + atividades lançadas fora da agenda.'
  );
  L.push('');

  if (p.incluirContexto) {
    const contexto = (p.config?.contexto || '').trim();
    if (contexto) {
      L.push('## Meu contexto');
      L.push(contexto);
      L.push('');
    }
    const ativos = (p.objetivos || []).filter((o) => o && o.status === 'ativo');
    if (ativos.length) {
      L.push('## Objetivos de médio/longo prazo');
      for (const o of ativos) {
        const pil = (p.pilares || []).find((x) => x.id === o.pilar_id)?.nome || '';
        const prazoStr = o.prazo ? `, prazo ${ddmm(o.prazo)}/${String(o.prazo).slice(0, 4)}` : '';
        L.push(`- **${o.titulo}** (${pil}${prazoStr})${o.descricao ? ` — ${o.descricao}` : ''}`);
      }
      L.push('');
    }
  }

  // ---------- Resumo ----------
  const ad = s.aderencia;
  const adAnt = anterior.aderencia;
  L.push('## Resumo');
  L.push(
    `- **Aderência à agenda:** ${pct(ad.pct)} — ${ad.feitos} feitos, ${ad.parciais} parciais, ${ad.naoFeitos} não feitos, ${ad.remarcados} remarcados (semana anterior: ${pct(adAnt.pct)})`
  );
  L.push(`- **Score semanal das metas:** ${s.score ?? '—'}/100 (semana anterior: ${anterior.score ?? '—'}/100)`);
  if (ad.pendentes > 0) L.push(`- ⚠️ ${ad.pendentes} item(ns) planejado(s) sem resposta no check-in.`);
  if (ad.futuros > 0) L.push(`- ${ad.futuros} item(ns) ainda por acontecer nesta semana.`);
  L.push('');

  // ---------- Por pilar ----------
  L.push('## Metas por pilar');
  for (const sp of s.pilares) {
    if (sp.categorias.length === 0) continue;
    L.push(`### ${sp.pilar.nome} — ${pct(sp.pct)} (peso ${sp.pilar.peso_no_score_geral}%)`);
    for (const sc of sp.categorias) {
      const c = sc.categoria;
      const partes: string[] = [];
      if (c.meta_semanal_sessoes > 0) partes.push(`sessões ${sc.sessoes}/${c.meta_semanal_sessoes}`);
      else partes.push(`sessões ${sc.sessoes}`);
      if (c.meta_semanal_volume > 0) partes.push(`volume ${linhaMeta(sc.volume, c.meta_semanal_volume, c.unidade)}`);
      else if (sc.volume > 0 && c.unidade !== 'sessões') partes.push(`volume ${formatarNumero(sc.volume)} ${c.unidade}`);
      if (sc.planejados > 0) partes.push(`${sc.planejados} planejada(s)`);
      L.push(`- **${c.nome}:** ${partes.join(' · ')}${iconePct(sc.pct)}`);
      for (const r of [...sc.falhas, ...sc.parciais]) {
        const extra = [r.motivo && `motivo: ${r.motivo}`, r.nota && `nota: "${r.nota}"`].filter(Boolean).join(' — ');
        L.push(
          `  - ${rotuloDia(r.data)}${r.hora ? ` ${r.hora}` : ''}: ${statusTexto(r.status)}${
            r.status === 'parcial' ? ` (${formatarNumero(r.valor)} ${r.unidade})` : ''
          }${extra ? ` — ${extra}` : ''}`
        );
      }
    }
    L.push('');
  }

  // ---------- Dia a dia ----------
  L.push('## Dia a dia');
  for (const d of s.dias) {
    const doDia = (s.registros || [])
      .filter((r) => r.data === d && r.status !== 'ignorado')
      .sort((a, b) => (a.hora || '99').localeCompare(b.hora || '99'));
    const pend = (s.pendentes || []).filter((x) => x.data === d);
    if (doDia.length === 0 && pend.length === 0) {
      L.push(`- **${DIAS_LONGOS[diaSemana(d)]} ${ddmm(d)}:** sem registros`);
      continue;
    }
    const itens = doDia.map((r) => {
      const qtd = contaComoFeito(r) && r.unidade !== 'sessões' ? ` ${formatarNumero(r.valor)} ${r.unidade}` : '';
      const fora = r.origem === 'manual' ? ' (fora da agenda)' : '';
      return `${nomeCat(p.categorias, r.categoria_id)}${qtd} ${statusIcone(r.status)}${fora}`;
    });
    pend.forEach((x) => itens.push(`${x.titulo} ❔ sem resposta`));
    L.push(`- **${DIAS_LONGOS[diaSemana(d)]} ${ddmm(d)}:** ${itens.join(' · ')}`);
  }
  L.push('');

  // ---------- Fora da agenda ----------
  if (s.foraDaAgenda.length) {
    L.push('## Atividades fora da agenda');
    for (const r of s.foraDaAgenda) {
      L.push(
        `- ${rotuloDia(r.data)}: ${nomeCat(p.categorias, r.categoria_id)} — ${formatarNumero(r.valor)} ${r.unidade}${r.nota ? ` — "${r.nota}"` : ''}`
      );
    }
    L.push('');
  }

  // ---------- Motivos ----------
  const motivos = Object.entries(s.motivos).sort((a, b) => b[1] - a[1]);
  if (motivos.length) {
    L.push('## Motivos das falhas');
    motivos.forEach(([m, n]) => L.push(`- ${m}: ${n}x`));
    L.push('');
  }

  // ---------- Notas ----------
  const notas = s.registros.filter((r) => r.nota && contaComoFeito(r) && r.origem !== 'manual');
  if (notas.length) {
    L.push('## Notas registradas');
    notas.forEach((r) => L.push(`- ${rotuloDia(r.data)} · ${nomeCat(p.categorias, r.categoria_id)}: "${r.nota}"`));
    L.push('');
  }

  // ---------- Tendência ----------
  const semanas = [...historico, s];
  L.push('## Tendência (últimas 4 semanas, sessões feitas)');
  L.push(`| Categoria | ${semanas.map((x) => ddmm(x.inicio)).join(' | ')} | Meta |`);
  L.push(`|---|${semanas.map(() => '---').join('|')}|---|`);
  for (const c of p.categorias.filter((c) => !c.inativa)) {
    const vals = semanas.map((x) => {
      const sc = x.pilares.flatMap((pp) => pp.categorias).find((k) => k.categoria.id === c.id);
      return sc ? String(sc.sessoes) : '0';
    });
    L.push(`| ${c.nome} | ${vals.join(' | ')} | ${c.meta_semanal_sessoes || '—'} |`);
  }
  L.push(`| **Aderência** | ${semanas.map((x) => pct(x.aderencia.pct)).join(' | ')} | — |`);
  L.push('');

  // ---------- Padrões ----------
  const padroes = detectarPadroes(p.registros, s.fim, p.categorias);
  if (padroes.length) {
    L.push('## Padrões detectados (últimas 4 semanas)');
    padroes.forEach((x) => L.push(`- ${x}`));
    L.push('');
  }

  // ---------- Pedido ----------
  L.push('## O que eu preciso de você, Gemini');
  L.push('1. Analise meu desempenho da semana: onde fui bem, onde falhei e por quê (use os motivos e notas).');
  L.push('2. Aponte gargalos e padrões (dias/horários que mais falham) e sugira ajustes realistas.');
  L.push('3. Proponha a agenda da próxima semana seguindo o padrão de eventos "[Tag] descrição — quantidade" no calendário "' + (p.config.nome_calendario || 'Rotina') + '", e só crie os eventos depois que eu confirmar.');

  return L.join('\n');
}

export interface ParamsRelatorioMensal {
  ano: number;
  mes: number; // 1 a 12
  pilares: Pilar[];
  categorias: Categoria[];
  registros: Registro[];
  eventos: EventoAgenda[];
  agendaConectada: boolean;
  objetivos: Objetivo[];
  config: ConfigGeral;
  incluirContexto: boolean;
}

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/** Relatório mensal consolidado para quando o usuário passar semanas sem enviar ao Gemini */
export function gerarRelatorioMensal(p: ParamsRelatorioMensal): string {
  const mesStr = String(p.mes).padStart(2, '0');
  const dataInicio = `${p.ano}-${mesStr}-01`;
  const ultimoDiaNum = new Date(p.ano, p.mes, 0).getDate();
  const dataFim = `${p.ano}-${mesStr}-${String(ultimoDiaNum).padStart(2, '0')}`;

  const regsMes = p.registros.filter((r) => r.data >= dataInicio && r.data <= dataFim);
  const feitos = regsMes.filter((r) => r.status === 'feito');
  const parciais = regsMes.filter((r) => r.status === 'parcial');
  const naoFeitos = regsMes.filter((r) => r.status === 'nao_feito');
  const remarcados = regsMes.filter((r) => r.status === 'remarcado');
  const respondidos = feitos.length + parciais.length + naoFeitos.length;
  const taxaAderencia = respondidos > 0 ? (feitos.length + parciais.length * 0.5) / respondidos : null;

  const L: string[] = [];

  L.push(`# Relatório Mensal Consolidado — ${MESES_NOMES[p.mes - 1]} de ${p.ano}`);
  L.push('');
  L.push(
    `> Relatório consolidado de **${MESES_NOMES[p.mes - 1]}/${p.ano}** (${ultimoDiaNum} dias) gerado pelo App Rotina. Inclui todas as execuções, notas, falhas e padrões acumulados no mês.`
  );
  L.push('');

  if (p.incluirContexto) {
    const contexto = (p.config?.contexto || '').trim();
    if (contexto) {
      L.push('## Meu contexto');
      L.push(contexto);
      L.push('');
    }
    const ativos = (p.objetivos || []).filter((o) => o && o.status === 'ativo');
    if (ativos.length) {
      L.push('## Objetivos de médio/longo prazo');
      for (const o of ativos) {
        const pil = (p.pilares || []).find((x) => x.id === o.pilar_id)?.nome || '';
        const prazoStr = o.prazo ? `, prazo ${ddmm(o.prazo)}/${String(o.prazo).slice(0, 4)}` : '';
        L.push(`- **${o.titulo}** (${pil}${prazoStr})${o.descricao ? ` — ${o.descricao}` : ''}`);
      }
      L.push('');
    }
  }

  // ---------- Resumo Geral do Mês ----------
  L.push('## Resumo Geral do Mês');
  L.push(
    `- **Aderência Global no Mês:** ${pct(taxaAderencia)} — ${feitos.length} concluídos, ${parciais.length} parciais, ${naoFeitos.length} não realizados, ${remarcados.length} remarcados`
  );
  L.push(`- **Total de registros realizados:** ${feitos.length + parciais.length} execuções registradas`);
  const foraAgenda = regsMes.filter((r) => r.origem === 'manual' && contaComoFeito(r));
  L.push(`- **Atividades extras fora da agenda:** ${foraAgenda.length} lançamentos`);
  L.push('');

  // ---------- Desempenho por Pilar e Hábito no Mês ----------
  L.push('## Desempenho Consolidado por Pilar e Hábito');
  for (const pilar of [...p.pilares].sort((a, b) => a.numero - b.numero)) {
    const catsPilar = p.categorias.filter((c) => c.pilar_id === pilar.id && !c.inativa);
    if (catsPilar.length === 0) continue;

    L.push(`### ${pilar.nome} (Peso ${pilar.peso_no_score_geral}%)`);
    for (const c of catsPilar) {
      const rc = regsMes.filter((r) => r.categoria_id === c.id);
      const feitosCat = rc.filter(contaComoFeito);
      const sessoesTotal = feitosCat.length;
      const volumeTotal = Math.round(feitosCat.reduce((s, r) => s + (Number(r.valor) || 0), 0) * 100) / 100;

      // Meta mensal esperada aproximada (~4.3 semanas)
      const semanasNoMes = ultimoDiaNum / 7;
      const metaSessoesMes = c.meta_semanal_sessoes > 0 ? Math.round(c.meta_semanal_sessoes * semanasNoMes) : 0;
      const metaVolumeMes = c.meta_semanal_volume > 0 ? Math.round(c.meta_semanal_volume * semanasNoMes) : 0;

      const partes: string[] = [];
      if (metaSessoesMes > 0) partes.push(`sessões: ${sessoesTotal}/${metaSessoesMes}`);
      else partes.push(`sessões: ${sessoesTotal}`);

      if (metaVolumeMes > 0) partes.push(`volume: ${formatarNumero(volumeTotal)}/${formatarNumero(metaVolumeMes)} ${c.unidade}`);
      else if (volumeTotal > 0 && c.unidade !== 'sessões') partes.push(`volume: ${formatarNumero(volumeTotal)} ${c.unidade}`);

      const falhasCat = rc.filter((r) => r.status === 'nao_feito');
      if (falhasCat.length > 0) partes.push(`${falhasCat.length} não realizado(s)`);

      L.push(`- **${c.nome}:** ${partes.join(' · ')}`);
    }
    L.push('');
  }

  // ---------- Motivos de Falhas no Mês ----------
  const motivosMes: Record<string, number> = {};
  naoFeitos.forEach((r) => {
    const m = r.motivo || 'Sem motivo especificado';
    motivosMes[m] = (motivosMes[m] || 0) + 1;
  });
  const motivosOrdenados = Object.entries(motivosMes).sort((a, b) => b[1] - a[1]);
  if (motivosOrdenados.length > 0) {
    L.push('## Principais Motivos de Falha no Mês');
    motivosOrdenados.forEach(([motivo, count]) => {
      L.push(`- **${motivo}:** ${count} ocorrência(s)`);
    });
    L.push('');
  }

  // ---------- Padrões do Mês ----------
  const padroes = detectarPadroes(p.registros, dataFim, p.categorias);
  if (padroes.length) {
    L.push('## Padrões e Gargalos Detectados no Mês');
    padroes.forEach((x) => L.push(`- ${x}`));
    L.push('');
  }

  // ---------- Destaques e Notas do Mês ----------
  const notasMes = regsMes.filter((r) => r.nota && contaComoFeito(r));
  if (notasMes.length > 0) {
    L.push('## Notas e Observações Relevantes do Mês');
    notasMes.slice(0, 15).forEach((r) => {
      L.push(`- ${rotuloDia(r.data)} (${nomeCat(p.categorias, r.categoria_id)}): "${r.nota}"`);
    });
    L.push('');
  }

  // ---------- Pedido para o Gemini ----------
  L.push('## O que eu preciso de você, Gemini (Diagnóstico Mensal)');
  L.push('1. **Balanço Geral do Mês:** Avalie minha consistência e disciplina ao longo de todo este mês.');
  L.push('2. **Gargalos Recorrentes:** Quais foram os maiores pontos de atrito (dias, horários ou hábitos) que mais sofreram falhas?');
  L.push('3. **Ajustes Estratégicos:** Que mudanças graduais você propõe para o próximo mês para que eu consiga manter o ritmo sem me sobrecarregar?');
  L.push('4. **Planejamento do Próximo Ciclo:** Proponha a distribuição da semana inicial do próximo mês no padrão `[Tag] descrição — quantidade` para agendarmos no calendário "' + (p.config.nome_calendario || 'Rotina') + '".');

  return L.join('\n');
}

/** Padrões simples: dias da semana e horários com mais falhas */
function detectarPadroes(registros: Registro[], fim: string, categorias: Categoria[]): string[] {
  const inicio = addDias(fim, -27);
  const regs = registros.filter((r) => r.data >= inicio && r.data <= fim && r.origem !== 'manual' && r.status !== 'remarcado');
  if (regs.length < 5) return [];
  const out: string[] = [];

  const porDia: Record<number, { tot: number; ok: number }> = {};
  regs.forEach((r) => {
    const d = diaSemana(r.data);
    porDia[d] = porDia[d] || { tot: 0, ok: 0 };
    porDia[d].tot++;
    if (contaComoFeito(r)) porDia[d].ok++;
  });
  const dias = Object.entries(porDia)
    .filter(([, v]) => v.tot >= 3)
    .map(([d, v]) => ({ d: Number(d), taxa: v.ok / v.tot, ...v }))
    .sort((a, b) => a.taxa - b.taxa);
  if (dias.length >= 2) {
    const pior = dias[0];
    const melhor = dias[dias.length - 1];
    if (pior.taxa < melhor.taxa) {
      out.push(`Dia com menor cumprimento: **${DIAS_LONGOS[pior.d]}** (${pior.ok}/${pior.tot}). Melhor: ${DIAS_LONGOS[melhor.d]} (${melhor.ok}/${melhor.tot}).`);
    }
  }

  const tarde = regs.filter((r) => r.hora && r.hora >= '19:00');
  if (tarde.length >= 3) {
    const ok = tarde.filter(contaComoFeito).length;
    const cedo = regs.filter((r) => r.hora && r.hora < '19:00');
    const okCedo = cedo.filter(contaComoFeito).length;
    if (cedo.length >= 3) {
      out.push(
        `Itens agendados a partir das 19h: ${ok}/${tarde.length} cumpridos (${pct(ok / tarde.length)}); antes das 19h: ${okCedo}/${cedo.length} (${pct(okCedo / cedo.length)}).`
      );
    }
  }

  for (const c of categorias) {
    const rc = regs.filter((r) => r.categoria_id === c.id);
    const falhas = rc.filter((r) => r.status === 'nao_feito');
    if (rc.length >= 3 && falhas.length / rc.length >= 0.5) {
      out.push(`**${c.nome}** falhou em ${falhas.length} de ${rc.length} vezes planejadas.`);
    }
  }
  return out;
}

// ============================================================
// Instruções do Gem "Planejador de Rotina" (Gemini)
// ============================================================

export function gerarInstrucoesGem(
  pilares: Pilar[],
  categorias: Categoria[],
  objetivos: Objetivo[],
  config: ConfigGeral
): string {
  const cal = config.nome_calendario || 'Rotina';
  const ativas = categorias.filter((c) => !c.inativa);
  const L: string[] = [];

  L.push('# Papel');
  L.push(
    `Você é o meu **Planejador de Rotina**. Você transforma minhas tarefas (Google Tasks) e meus relatórios semanais em eventos no Google Agenda. Um app lê esses eventos todos os dias e me pergunta se eu cumpri cada um — por isso o padrão abaixo é OBRIGATÓRIO. Evento fora do padrão é invisível para o app.`
  );
  L.push('');
  L.push('# Regras de criação de eventos (obrigatórias)');
  L.push(`1. **Calendário:** crie TODOS os eventos de hábitos no calendário chamado **"${cal}"**. Ao usar o Google Agenda, diga explicitamente "no calendário ${cal}". Nunca use o calendário principal para hábitos.`);
  L.push('2. **Título:** `[Tag] descrição curta — quantidade`');
  L.push('   - A tag entre colchetes vem SEMPRE no início e deve ser EXATAMENTE uma das tags da tabela abaixo (com a mesma grafia).');
  L.push('   - Um hábito por evento. Nunca junte duas tags no mesmo evento.');
  L.push('   - Quando a categoria mede volume, escreva a quantidade com a unidade: `5 km`, `30 páginas`, `2 h`, `45 min`. A quantidade fica FORA dos colchetes.');
  L.push('3. **Horário:** sempre com início e fim (nada de "dia inteiro"). Use a duração da tabela, salvo se eu pedir outra.');
  L.push('4. **Lembretes:** mantenha a notificação padrão do calendário (é ela que me avisa).');
  L.push('5. **Prefira eventos individuais** para cada dia da semana planejada (em vez de recorrência infinita) — fica mais fácil remarcar uma semana sem quebrar as outras.');
  L.push('6. **Remarcar = mover o evento existente.** Nunca duplique. Se cancelar, apague.');
  L.push('7. **Não crie eventos com tag** para trabalho na Cresol, reuniões ou tarefas pontuais. Tarefas que não são hábito vão para o Google Tasks ou para o calendário principal SEM colchetes.');
  L.push('8. **Antes de criar**, mostre a proposta numa tabela (Dia | Início–Fim | Título) e espere minha confirmação. Depois crie tudo de uma vez e confirme o que foi criado.');
  L.push('9. Respeite as transições: treino de força ou corrida marcam o fim do turno de trabalho; leitura fica à noite, longe do setup de trabalho.');
  L.push('10. **Estudo:** NUNCA force nem pré-agende eventos de [Estudo] por iniciativa própria na semana base. Estudo é sob demanda ou por meta mensal: só crie eventos de [Estudo] quando eu pedir explicitamente ou disser os dias/horários em que vou estudar.');
  L.push('');

  L.push('# Tabela de tags (única fonte da verdade)');
  L.push('| Tag (título) | Hábito | Pilar | Unidade | Qtd. padrão | Meta semanal | Dias ideais | Horário | Duração |');
  L.push('|---|---|---|---|---|---|---|---|---|');
  for (const c of ativas) {
    const pil = pilares.find((p) => p.id === c.pilar_id)?.nome || '';
    const meta = [
      c.meta_semanal_sessoes > 0 ? `${c.meta_semanal_sessoes}x` : '',
      c.meta_semanal_volume > 0 ? `${formatarNumero(c.meta_semanal_volume)} ${c.unidade}` : ''
    ]
      .filter(Boolean)
      .join(' / ');
    const dias = (c.dias_planejados || [])
      .slice()
      .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
      .map((d) => DIAS_CURTOS[d])
      .join(', ');
    L.push(
      `| \`[${c.tag}]\` | ${c.nome} | ${pil} | ${c.unidade} | ${formatarNumero(c.valor_padrao)} | ${meta || '—'} | ${dias || 'livre'} | ${c.horario_sugerido || '—'} | ${c.duracao_min ? `${c.duracao_min} min` : '—'} |`
    );
  }
  L.push('');
  const comDescricao = ativas.filter((c) => c.descricao);
  if (comDescricao.length) {
    L.push('**Observações por hábito:**');
    comDescricao.forEach((c) => L.push(`- \`[${c.tag}]\`: ${c.descricao}`));
    L.push('');
  }

  L.push('# Exemplos');
  L.push('Corretos:');
  const ex = (tag: string, desc: string) => {
    const c = ativas.find((k) => k.tag === tag);
    return c ? `- \`[${c.tag}] ${desc}\`` : null;
  };
  [
    ex('Corrida', 'Rodagem leve — 5 km'),
    ex('Treino', 'Peito + Ombro anterior — 60 min'),
    ex('Treino', 'Costas + Bíceps + Ombro lat/post — 60 min'),
    ex('Leitura', 'Sapiens — 30 páginas'),
    ex('Estudo', 'Faculdade ADS: Banco de Dados — 2 h'),
    ex('FEIT', 'SaaS NFC-e: tela de relatórios — 3 h')
  ]
    .filter(Boolean)
    .forEach((x) => L.push(x as string));
  L.push('');
  L.push('Errados (o app NÃO reconhece):');
  L.push('- `Correr 5km` → falta a tag entre colchetes');
  L.push('- `[Corrida 5 km]` → quantidade dentro do colchete');
  L.push('- `[Corrida/Treino] ...` → duas tags no mesmo evento');
  L.push('- `Treino [Peito]` → a tag precisa estar no INÍCIO');
  L.push('');

  // Semana base
  L.push('# Semana base (ponto de partida)');
  for (const d of [1, 2, 3, 4, 5, 6, 0]) {
    const doDia = ativas
      .filter((c) => (c.dias_planejados || []).includes(d))
      .sort((a, b) => (a.horario_sugerido || '').localeCompare(b.horario_sugerido || ''))
      .map((c) => `${c.horario_sugerido || ''} [${c.tag}]`.trim());
    L.push(`- **${DIAS_LONGOS[d]}:** ${doDia.length ? doDia.join(' · ') : 'livre'}`);
  }
  L.push('');

  L.push('# Como trabalhamos');
  L.push('**Quando eu colar o "Relatório Semanal de Rotina":**');
  L.push('1. Analise aderência, metas, motivos de falha e padrões. Seja direto e honesto, sem bajulação.');
  L.push('2. Proponha no máximo 3 ajustes concretos (horário, volume, dia). Progressão gradual: corrida no máximo +10% de volume por semana.');
  L.push('3. Monte a agenda da semana seguinte no padrão acima e crie os eventos após minha confirmação.');
  L.push('');
  L.push('**Quando eu colar tarefas do Google Tasks:** encaixe-as em horários livres sem conflitar com os hábitos. Tarefas que não são hábitos ficam sem colchetes.');
  L.push('');
  L.push('**Quando eu pedir para remarcar algo** ("hoje não vou conseguir correr"): mova o evento para o próximo horário viável que não conflite com musculação (corrida não vai em dia de força).');
  L.push('');

  const contexto = (config?.contexto || '').trim();
  if (contexto) {
    L.push('# Meu contexto');
    L.push(contexto);
    L.push('');
  }
  const ativos = (objetivos || []).filter((o) => o && o.status === 'ativo');
  if (ativos.length) {
    L.push('# Objetivos de médio/longo prazo');
    ativos.forEach((o) => {
      const prazoStr = o.prazo ? ` (prazo ${ddmm(o.prazo)}/${String(o.prazo).slice(0, 4)})` : '';
      L.push(`- **${o.titulo}**${prazoStr}${o.descricao ? ` — ${o.descricao}` : ''}`);
    });
  }
  return L.join('\n');
}
