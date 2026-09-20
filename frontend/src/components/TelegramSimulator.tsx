import React, { useState, useRef, useEffect } from 'react';
import { Pilar, Categoria, AtividadeCadastrada } from '../types';
import { Send, Bot, RotateCcw, Check, Sparkles, Terminal } from 'lucide-react';

interface TelegramSimulatorProps {
  pilares?: Pilar[];
  categorias: Categoria[];
  atividades: AtividadeCadastrada[];
  onAddAtividadeFromBot: (nova: Omit<AtividadeCadastrada, 'id' | 'criado_em'>) => string;
  onRegistrarFeito?: (catNome: string, ativNome: string, valor: number) => { pontos: number; pilarNome: string } | void;
  onAgendarPontual?: (hora: string, titulo: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  buttons?: Array<{
    label: string;
    callbackData: string;
    action: () => void;
  }>;
}

export const TelegramSimulator: React.FC<TelegramSimulatorProps> = ({
  pilares = [],
  categorias,
  atividades,
  onAddAtividadeFromBot,
  onRegistrarFeito,
  onAgendarPontual
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: `👋 *Sistema de Gestão de Rotina & Metas (Simulador Telegram)*\n\nNo Telegram você lança direto na categoria e atividade. Os Pilares computam os pontos nos bastidores!\n\nComandos disponíveis:\n✅ \`/feito corrida Parque 5\` - Lança 5 km na Corrida e pontua no Pilar Atividade Física\n📅 \`/agenda\` - Mostra a agenda de hoje\n⚡ \`/agendar 14:30 Dentista\` - Compromisso pontual\n➕ \`/nova_atividade Esteira\` - Cadastra nova atividade`,
      time: '12:00'
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotMessage = (text: string, buttons?: Message['buttons']) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        id: `bot_${Date.now()}_${Math.random()}`,
        sender: 'bot',
        text,
        time,
        buttons
      }
    ]);
  };

  const addUserMessage = (text: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        id: `usr_${Date.now()}_${Math.random()}`,
        sender: 'user',
        text,
        time
      }
    ]);
  };

  const handleCommand = (cmd: string) => {
    const cleanCmd = cmd.trim();
    if (!cleanCmd) return;
    addUserMessage(cleanCmd);

    // 1. /start ou /help
    if (cleanCmd === '/start' || cleanCmd === '/help') {
      setTimeout(() => {
        addBotMessage(
          `👋 *Bot de Rotina & Metas*\n\n` +
            `Comandos principais:\n` +
            `✅ \`/feito [categoria] [atividade] [quantidade]\` - Ex: \`/feito corrida Parque 5\`\n` +
            `📅 \`/agenda\` - Visão unificada do dia\n` +
            `⚡ \`/agendar <hh:mm> <descricao>\` - Ex: \`/agendar 14:30 Dentista\`\n` +
            `➕ \`/nova_atividade [nome]\` - Ex: \`/nova_atividade Esteira\`\n` +
            `📊 \`/score\` - Ver Score Geral dos Pilares`
        );
      }, 300);
      return;
    }

    // 2. /score
    if (cleanCmd === '/score') {
      setTimeout(() => {
        addBotMessage(
          `📊 *SCORE GERAL DOS PILARES (Setembro 2026)*\n\n` +
            `🏆 *Score Geral:* \`78/100 pts\`\n\n` +
            `*Status dos Pilares:*\n` +
            `• 1 - Atividade Física: \`42/60 pts\` (70%) - Peso: 30%\n` +
            `• 2 - Estudos e Leitura: \`38/50 pts\` (76%) - Peso: 25%\n` +
            `• 3 - Trabalho: \`60/80 pts\` (75%) - Peso: 30%\n` +
            `• 4 - Tarefas Domésticas: \`21/30 pts\` (70%) - Peso: 15%\n` +
            `• 5 - Diversos: Registro livre (sem meta)`
        );
      }, 300);
      return;
    }

    // 3. /agenda
    if (cleanCmd === '/agenda') {
      setTimeout(() => {
        addBotMessage(
          `📅 *AGENDA DE HOJE*\n\n` +
            `• ✅ \`06:30\` - *Corrida Matinal (Parque da Cidade)*\n` +
            `• ⏳ \`10:00\` - *Alinhamento de Projetos (Meet)*\n` +
            `• ⏳ \`19:30\` - *Futsal Semanal (Racha)*`
        );
      }, 300);
      return;
    }

    // 4. /agendar <hh:mm> <descricao>
    if (cleanCmd.startsWith('/agendar')) {
      const partes = cleanCmd.split(' ');
      if (partes.length < 2) {
        setTimeout(() => {
          addBotMessage(`⚠️ Use: \`/agendar <hh:mm> <descricao>\`\nExemplo: \`/agendar 14:30 Dentista\``);
        }, 300);
        return;
      }

      const hora = partes[1].includes(':') ? partes[1] : 'A definir';
      const titulo = partes[1].includes(':') ? partes.slice(2).join(' ') : partes.slice(1).join(' ');

      if (onAgendarPontual) {
        onAgendarPontual(hora, titulo || 'Compromisso Avulso');
      }

      setTimeout(() => {
        addBotMessage(
          `✅ *Compromisso agendado para hoje!*\n\n` +
            `📌 *${titulo || 'Lembrete'}*\n` +
            `⏰ Horário: \`${hora}\`\n` +
            `ℹ️ _Adicionado à sua aba de Calendário._`
        );
      }, 300);
      return;
    }

    // 5. /nova_atividade [nome]
    if (cleanCmd.startsWith('/nova_atividade')) {
      const partes = cleanCmd.split(' ');
      const nomeAtiv = partes.length > 1 ? partes.slice(1).join(' ') : 'Atividade';

      const botoes = categorias.map((cat) => ({
        label: `${cat.nome} (${cat.unidade_padrao})`,
        callbackData: `cat_${cat.id}`,
        action: () => {
          onAddAtividadeFromBot({
            nome: nomeAtiv,
            categoria_id: cat.id,
            categoria_nome: cat.nome,
            pilar_id: cat.pilar_id,
            unidade: cat.unidade_padrao,
            recorrente: true,
            afeta_meta: true
          });
          const pilar = pilares.find((p) => p.id === cat.pilar_id);
          addBotMessage(
            `🎉 *Atividade cadastrada com sucesso!*\n\n` +
              `📌 *Nome:* ${nomeAtiv}\n` +
              `📁 *Categoria:* ${cat.nome}\n` +
              `🏛️ *Pilar Soberano:* ${pilar?.nome || 'Geral'}\n` +
              `📏 *Unidade:* \`${cat.unidade_padrao}\`\n\n` +
              `_Agora você pode lançar: \`/feito ${cat.nome.toLowerCase().split(' ')[0]} ${nomeAtiv} 5\`_`
          );
        }
      }));

      setTimeout(() => {
        addBotMessage(
          `🎯 Cadastrando a atividade: *${nomeAtiv}*\n\nSelecione a qual Categoria ela pertence:`,
          botoes
        );
      }, 300);
      return;
    }

    // 6. /feito [categoria] [atividade] [quantidade]
    if (cleanCmd.startsWith('/feito')) {
      const partes = cleanCmd.replace('/feito', '').trim().split(' ');

      if (partes.length >= 3) {
        const catInput = partes[0].toLowerCase();
        const qtdStr = partes[partes.length - 1];
        const ativ = partes.slice(1, partes.length - 1).join(' ');
        const valor = parseFloat(qtdStr.replace(',', '.'));

        if (isNaN(valor)) {
          setTimeout(() => {
            addBotMessage(`⚠️ A quantidade deve ser um número! Ex: \`/feito corrida Parque 5\``);
          }, 300);
          return;
        }

        const catEncontrada = categorias.find(
          (c) =>
            c.id.toLowerCase() === catInput ||
            c.nome.toLowerCase().includes(catInput)
        );

        let res: any = null;
        if (onRegistrarFeito) {
          res = onRegistrarFeito(catInput, ativ, valor);
        }

        const unidade = catEncontrada ? catEncontrada.unidade_padrao : '';
        const pontos = res?.pontos ?? (catEncontrada ? Number((valor * catEncontrada.pontos_por_unidade).toFixed(1)) : 0);
        const pilarNome = res?.pilarNome ?? (pilares.find((p) => p.id === catEncontrada?.pilar_id)?.nome || 'Pilar');

        setTimeout(() => {
          addBotMessage(
            `✅ *Lançamento concluído com sucesso!*\n\n` +
              `📁 *Categoria:* ${catEncontrada ? catEncontrada.nome : catInput}\n` +
              `📌 *Atividade:* ${ativ}\n` +
              `➕ *Registrado:* \`+${valor} ${unidade}\`\n` +
              `⚡ *Pontos no Pilar:* \`+${pontos} pontos\` para *${pilarNome}*\n\n` +
              `_O progresso da categoria e os pontos do pilar foram computados no sistema!_`
          );
        }, 300);
        return;
      }

      // Se enviou /feito sozinho
      setTimeout(() => {
        addBotMessage(
          `📋 *Como registrar um feito:*\n\n` +
            `Envie: \`/feito [categoria] [atividade] [quantidade]\`\n\n` +
            `*Exemplos práticos:*\n` +
            `• \`/feito corrida Parque 5\` (+5 km e gera pontos de Atividade Física)\n` +
            `• \`/feito futsal Pelada 1.5\` (+1.5h de futsal no mesmo pilar)\n` +
            `• \`/feito leitura Habitos 30\` (+30 páginas para Estudos)\n` +
            `• \`/feito trabalho Expediente 8\` (+8 horas no Trabalho)`
        );
      }, 300);
      return;
    }

    // Comando não reconhecido
    setTimeout(() => {
      addBotMessage(
        `❓ Comando não reconhecido.\n` +
          `Experimente digitar:\n` +
          `• \`/feito corrida Parque 5\`\n` +
          `• \`/nova_atividade Esteira\`\n` +
          `• \`/agendar 14:30 Dentista\`\n` +
          `• \`/score\` ou \`/agenda\``
      );
    }, 300);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const txt = inputVal;
    setInputVal('');
    handleCommand(txt);
  };

  return (
    <div className="max-w-3xl mx-auto bg-[#0d0d0d] rounded-2xl border border-[#222] overflow-hidden flex flex-col h-[650px] shadow-sm">
      {/* Top Header */}
      <div className="bg-[#121212] border-b border-[#222] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">Bot de Rotina & Metas (Telegram)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <span className="text-[11px] text-[#777] font-mono">Simulador de comandos com integração a Pilares</span>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'm1',
                sender: 'bot',
                text: `👋 *Sistema de Gestão de Rotina & Metas*\n\nExperimente: \`/feito corrida Parque 5\` ou \`/nova_atividade Esteira\``,
                time: '12:00'
              }
            ])
          }
          className="p-1.5 text-[#666] hover:text-white rounded-lg transition-colors cursor-pointer"
          title="Reiniciar chat"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs whitespace-pre-line leading-relaxed shadow-xs ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-[#181818] border border-[#262626] text-[#e0e0e0] rounded-bl-none'
              }`}
            >
              {m.text}

              {/* Action Buttons if any */}
              {m.buttons && m.buttons.length > 0 && (
                <div className="mt-3 pt-2 border-t border-[#2a2a2a] flex flex-wrap gap-2">
                  {m.buttons.map((btn, idx) => (
                    <button
                      key={idx}
                      onClick={btn.action}
                      className="px-2.5 py-1 rounded bg-[#252525] hover:bg-amber-500 hover:text-black border border-[#333] text-amber-300 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] text-[#555] mt-1 px-1 font-mono">{m.time}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-[#121212] border-t border-[#222] flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Digite um comando: /feito corrida Parque 5 ou /score"
          className="flex-1 bg-[#181818] border border-[#303030] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-hidden focus:border-blue-500 font-mono"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </form>
    </div>
  );
};
