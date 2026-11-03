import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Sparkles,
  Bot,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Calendar
} from 'lucide-react';
import { Categoria, ConfigGeral, EventoAgenda, Objetivo, Pilar, Registro } from '../types';
import { addDias, ddmm, hoje, inicioSemana } from '../lib/datas';
import { gerarInstrucoesGem, gerarRelatorioMensal, gerarRelatorioSemanal } from '../lib/relatorio';
import { Card, Titulo, btnPrimario, btnSecundario, copiarTexto } from './ui';

interface RelatorioViewProps {
  pilares: Pilar[];
  categorias: Categoria[];
  registros: Registro[];
  eventos: EventoAgenda[];
  agendaConectada: boolean;
  objetivos: Objetivo[];
  config: ConfigGeral;
}

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const RelatorioView: React.FC<RelatorioViewProps> = ({
  pilares,
  categorias,
  registros,
  eventos,
  agendaConectada,
  objetivos,
  config
}) => {
  const [subAba, setSubAba] = useState<'relatorio' | 'gem'>('relatorio');
  const [tipoPeriodo, setTipoPeriodo] = useState<'semanal' | 'mensal'>('semanal');

  // Estado Semana
  const [semanaInicio, setSemanaInicio] = useState<string>(() => inicioSemana(hoje()));

  // Estado Mês
  const hojeDate = new Date();
  const [ano, setAno] = useState<number>(hojeDate.getFullYear());
  const [mes, setMes] = useState<number>(hojeDate.getMonth() + 1); // 1 a 12

  const [incluirContexto, setIncluirContexto] = useState<boolean>(true);
  const [copiadoRelatorio, setCopiadoRelatorio] = useState(false);
  const [copiadoGem, setCopiadoGem] = useState(false);

  // Navegação Semana
  const irSemanaAnterior = () => setSemanaInicio((prev) => addDias(prev, -7));
  const irProximaSemana = () => setSemanaInicio((prev) => addDias(prev, 7));
  const irSemanaAtual = () => setSemanaInicio(inicioSemana(hoje()));

  // Navegação Mês
  const irMesAnterior = () => {
    if (mes === 1) {
      setMes(12);
      setAno((a) => a - 1);
    } else {
      setMes((m) => m - 1);
    }
  };
  const irProximoMes = () => {
    if (mes === 12) {
      setMes(1);
      setAno((a) => a + 1);
    } else {
      setMes((m) => m + 1);
    }
  };
  const irMesAtual = () => {
    const d = new Date();
    setAno(d.getFullYear());
    setMes(d.getMonth() + 1);
  };

  const textoRelatorio =
    tipoPeriodo === 'semanal'
      ? gerarRelatorioSemanal({
          inicio: semanaInicio,
          pilares,
          categorias,
          registros,
          eventos,
          agendaConectada,
          objetivos,
          config,
          incluirContexto
        })
      : gerarRelatorioMensal({
          ano,
          mes,
          pilares,
          categorias,
          registros,
          eventos,
          agendaConectada,
          objetivos,
          config,
          incluirContexto
        });

  const textoGem = gerarInstrucoesGem(pilares, categorias, objetivos, config);

  const handleCopiarRelatorio = async () => {
    const ok = await copiarTexto(textoRelatorio);
    if (ok) {
      setCopiadoRelatorio(true);
      setTimeout(() => setCopiadoRelatorio(false), 2500);
    }
  };

  const handleCopiarGem = async () => {
    const ok = await copiarTexto(textoGem);
    if (ok) {
      setCopiadoGem(true);
      setTimeout(() => setCopiadoGem(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Sub-aba: Relatório Semanal/Mensal vs Instruções do Gem */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubAba('relatorio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              subAba === 'relatorio'
                ? 'bg-amber-500 text-black shadow-xs'
                : 'text-[#888] hover:text-white hover:bg-[#181818]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Relatório para o Gemini
          </button>

          <button
            type="button"
            onClick={() => setSubAba('gem')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              subAba === 'gem'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-[#888] hover:text-white hover:bg-[#181818]'
            }`}
          >
            <Bot className="w-4 h-4" />
            Habilidade do Google (Gemini Gem)
          </button>
        </div>

        {subAba === 'relatorio' && (
          <div className="flex items-center gap-1 bg-[#141414] border border-[#2a2a2a] p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTipoPeriodo('semanal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                tipoPeriodo === 'semanal'
                  ? 'bg-[#222] text-amber-400 border border-[#333]'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              Semanal (7 dias)
            </button>
            <button
              type="button"
              onClick={() => setTipoPeriodo('mensal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                tipoPeriodo === 'mensal'
                  ? 'bg-[#222] text-amber-400 border border-[#333]'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              Mensal (Mês Completo)
            </button>
          </div>
        )}
      </div>

      {subAba === 'relatorio' ? (
        <div className="space-y-4">
          {/* Barra de Controles do Relatório (Semanal ou Mensal) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] border border-[#222] p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              {tipoPeriodo === 'semanal' ? (
                <>
                  <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
                    <button
                      type="button"
                      onClick={irSemanaAnterior}
                      className="p-1 text-[#888] hover:text-white transition-colors cursor-pointer"
                      title="Semana anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={irSemanaAtual}
                      className="px-2 py-0.5 text-xs font-mono text-[#ccc] hover:text-white transition-colors cursor-pointer"
                    >
                      Esta Semana
                    </button>
                    <button
                      type="button"
                      onClick={irProximaSemana}
                      className="p-1 text-[#888] hover:text-white transition-colors cursor-pointer"
                      title="Próxima semana"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-[#888] font-mono">
                    Semana: <strong className="text-white">{ddmm(semanaInicio)} a {ddmm(addDias(semanaInicio, 6))}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
                    <button
                      type="button"
                      onClick={irMesAnterior}
                      className="p-1 text-[#888] hover:text-white transition-colors cursor-pointer"
                      title="Mês anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={irMesAtual}
                      className="px-2 py-0.5 text-xs font-mono text-[#ccc] hover:text-white transition-colors cursor-pointer"
                    >
                      Este Mês
                    </button>
                    <button
                      type="button"
                      onClick={irProximoMes}
                      className="p-1 text-[#888] hover:text-white transition-colors cursor-pointer"
                      title="Próximo mês"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-[#888] font-mono">
                    Mês: <strong className="text-white">{MESES_NOMES[mes - 1]} de {ano}</strong>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-[#aaa] cursor-pointer">
                <input
                  type="checkbox"
                  checked={incluirContexto}
                  onChange={(e) => setIncluirContexto(e.target.checked)}
                  className="rounded border-[#333] bg-[#1a1a1a] text-amber-500 focus:ring-0"
                />
                <span>Incluir contexto e metas longas</span>
              </label>

              <button
                type="button"
                onClick={handleCopiarRelatorio}
                className={btnPrimario}
              >
                {copiadoRelatorio ? (
                  <>
                    <Check className="w-4 h-4 text-black" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-black" />
                    <span>Copiar Relatório {tipoPeriodo === 'mensal' ? 'do Mês' : 'da Semana'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dica de Uso */}
          <div className="bg-[#141414] border border-[#222] p-3.5 rounded-xl flex items-center justify-between text-xs text-[#888]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {tipoPeriodo === 'semanal' ? (
                  <>
                    <b>Relatório Semanal:</b> Copie todo domingo e cole no Gemini para analisar os últimos 7 dias e montar a agenda da próxima semana.
                  </>
                ) : (
                  <>
                    <b>Relatório Mensal Consolidado:</b> Perfeito caso você tenha acumulado várias semanas de marcação no app sem enviar ao Gemini. Ele consolida o mês inteiro, soma volumes, calcula aderência e levanta gargalos do mês!
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Caixa de Texto do Relatório (Preview Markdown) */}
          <Card className="p-4 sm:p-5">
            <Titulo
              icone={<FileText className="w-4 h-4 text-amber-400" />}
              extra={
                <span className="text-xs font-mono text-[#666]">
                  {textoRelatorio.split('\n').length} linhas
                </span>
              }
            >
              Pré-visualização do Relatório ({tipoPeriodo === 'semanal' ? 'Semana' : 'Mês'})
            </Titulo>
            <pre className="mt-3 p-4 bg-[#0a0a0a] border border-[#222] rounded-xl text-xs font-mono text-[#ccc] whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[600px] select-all">
              {textoRelatorio}
            </pre>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header das Instruções do Gem */}
          <div className="bg-gradient-to-r from-purple-950/20 via-[#141414] to-[#141414] border border-purple-500/30 p-5 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                    Instruções para o Gemini
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Habilidade do Google: "Planejador de Rotina"
                </h2>
                <p className="text-xs sm:text-sm text-[#999] mt-1 max-w-xl">
                  Estas instruções ensinam o Gemini a criar eventos no Google Agenda no padrão exato que este app reconhece (com tags, tempos e calendário dedicado).
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopiarGem}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
              >
                {copiadoGem ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Instruções do Gem</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Passo a passo para criar o Gem */}
          <Card className="p-5 space-y-3 text-xs text-[#aaa]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" />
              Como configurar o seu Gem no Gemini (em 2 minutos):
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
              <li>
                Acesse o Gemini (<a href="https://gemini.google.com" target="_blank" rel="noreferrer" className="text-purple-400 underline inline-flex items-center gap-1">gemini.google.com <ExternalLink className="w-3 h-3" /></a>) e clique em <b>"Gerenciador de Gems"</b> (ou "Criar novo Gem").
              </li>
              <li>
                Dê o nome de <b>"Planejador de Rotina"</b> ao seu Gem.
              </li>
              <li>
                Clique no botão <b>"Copiar Instruções do Gem"</b> acima e cole no campo de <b>Instruções</b> do seu Gem.
              </li>
              <li>
                Certifique-se de que a extensão <b>Google Workspace</b> (Google Agenda e Tarefas) está ativada nas configurações do Gemini.
              </li>
              <li>
                <b>Pronto!</b> Quando você colar seu Google Tasks ou o Relatório Semanal/Mensal para este Gem, ele vai montar e agendar seus eventos com perfeição no seu calendário "{config.nome_calendario || 'Rotina'}".
              </li>
            </ol>
          </Card>

          {/* Pré-visualização do Prompt do Gem */}
          <Card className="p-4 sm:p-5">
            <Titulo
              icone={<Bot className="w-4 h-4 text-purple-400" />}
              extra={
                <span className="text-xs font-mono text-[#666]">
                  {textoGem.split('\n').length} linhas
                </span>
              }
            >
              Conteúdo das Instruções do Gem
            </Titulo>
            <pre className="mt-3 p-4 bg-[#0a0a0a] border border-[#222] rounded-xl text-xs font-mono text-[#ccc] whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[600px] select-all">
              {textoGem}
            </pre>
          </Card>
        </div>
      )}
    </div>
  );
};
