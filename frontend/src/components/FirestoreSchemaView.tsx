import React, { useState } from 'react';
import {
  Database,
  Layers,
  Link,
  Target,
  CalendarCheck,
  Inbox,
  TrendingUp,
  Code,
  CheckCircle2,
  HelpCircle,
  FolderTree
} from 'lucide-react';

export const FirestoreSchemaView: React.FC = () => {
  const [activeCollection, setActiveCollection] = useState<'atividades' | 'categorias' | 'metas' | 'instancias' | 'triagem'>('atividades');

  return (
    <div className="space-y-6">
      {/* Header explanation */}
      <div className="bg-[#0d0d0d] rounded-2xl border border-[#222] p-6 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#1a1a1a] text-amber-400 border border-[#2a2a2a] mt-1 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif italic text-white">
              Arquitetura & Modelagem de Dados no Firebase Firestore
            </h2>
            <p className="text-sm text-[#888] mt-1.5 leading-relaxed font-sans">
              Diferente de bancos relacionais (SQL), o Firestore é um banco de dados NoSQL baseado em documentos e coleções.
              Abaixo está a estrutura didática de como relacionar <strong className="text-[#ccc]">atividades</strong> a <strong className="text-[#ccc]">categorias</strong> com máxima performance e custo zero no free-tier.
            </p>
          </div>
        </div>

        {/* Golden Rule Banner */}
        <div className="mt-5 p-4 rounded-xl bg-[#15120c] border border-amber-900/40 text-xs text-amber-200/90 flex items-start gap-3 font-sans">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold block mb-1 text-amber-300">A Regra de Ouro da Referência no Firestore:</strong>
            Em NoSQL, para ligar <code className="bg-[#1c1810] text-amber-300 px-1.5 py-0.5 rounded font-mono border border-amber-900/50">atividades_cadastradas</code> a uma <code className="bg-[#1c1810] text-amber-300 px-1.5 py-0.5 rounded font-mono border border-amber-900/50">categoria</code>, a melhor prática do Google Cloud é armazenar a <strong>Tríade de Vínculo</strong>:
            <ul className="list-disc pl-5 mt-2 space-y-1 text-[#bbb]">
              <li><strong className="text-amber-200">categoria_id (string):</strong> Permite queries rápidas como <code className="font-mono text-amber-300">db.collection("atividades_cadastradas").where("categoria_id", "==", id)</code> sem joins caros.</li>
              <li><strong className="text-amber-200">categoria_ref (DocumentReference):</strong> O objeto de referência nativo do Firestore que aponta para <code className="font-mono text-amber-300">categorias/{'{id}'}</code> permitindo <code className="font-mono text-amber-300">ref.get()</code> direto.</li>
              <li><strong className="text-amber-200">categoria_nome (string - desnormalização):</strong> Evita 100 leituras no banco toda vez que você listar atividades com o nome da categoria no Telegram ou no PWA!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive Schema Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation of Collections */}
        <div className="lg:col-span-4 space-y-2">
          <h3 className="text-[10px] font-mono font-bold text-[#666] uppercase tracking-widest px-1">
            Coleções do Sistema
          </h3>

          {[
            {
              id: 'categorias' as const,
              name: 'categorias',
              status: 'Configurada & Ativa',
              icon: FolderTree,
              color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            },
            {
              id: 'atividades' as const,
              name: 'atividades_cadastradas',
              status: 'Passo Atual (Concluído!)',
              icon: Layers,
              color: 'text-amber-300 bg-amber-500/15 border-amber-500/30'
            },
            {
              id: 'metas' as const,
              name: 'metas',
              status: 'Próximo Passo (3 Níveis)',
              icon: Target,
              color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            },
            {
              id: 'instancias' as const,
              name: 'instancias_diarias',
              status: 'Rotina / Registros',
              icon: CalendarCheck,
              color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            },
            {
              id: 'triagem' as const,
              name: 'triagem_pendente',
              status: 'Entradas Rápidas Telegram',
              icon: Inbox,
              color: 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20'
            }
          ].map((col) => {
            const Icon = col.icon;
            const isSelected = activeCollection === col.id;
            return (
              <button
                key={col.id}
                id={`btn-col-${col.id}`}
                onClick={() => setActiveCollection(col.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#161616] text-white border-amber-500/50 shadow-sm'
                    : 'bg-[#0e0e0e] text-[#888] border-[#222] hover:border-[#333] hover:text-[#ccc]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${isSelected ? 'bg-[#222] text-amber-400 border-[#333]' : col.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-semibold block">{col.name}</span>
                    <span className={`text-[11px] ${isSelected ? 'text-amber-300/80 font-mono' : 'text-[#666]'}`}>
                      {col.status}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Collection Details Box */}
        <div className="lg:col-span-8 bg-[#0d0d0d] rounded-2xl border border-[#222] p-6 shadow-xs">
          {activeCollection === 'atividades' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-[#1f1f1f]">
                <div>
                  <h3 className="text-base font-serif italic text-white flex items-center gap-2.5">
                    <span className="font-mono text-amber-400 not-italic text-sm">atividades_cadastradas</span>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-sans not-italic font-medium">
                      Documento NoSQL
                    </span>
                  </h3>
                  <p className="text-xs text-[#888] mt-1">
                    Armazena os hábitos e tarefas disponíveis para o usuário executar na rotina.
                  </p>
                </div>
              </div>

              {/* Fields Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#222] text-[#666] uppercase font-mono tracking-wider text-[10px]">
                      <th className="pb-2.5">Campo</th>
                      <th className="pb-2.5">Tipo Firestore</th>
                      <th className="pb-2.5">Exemplo</th>
                      <th className="pb-2.5">Função na Arquitetura</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a] font-mono text-[11px]">
                    <tr>
                      <td className="py-2.5 font-bold text-white">id</td>
                      <td className="py-2.5 text-amber-400">String (Auto ID)</td>
                      <td className="py-2.5 text-[#777]">"ativ_musc_01"</td>
                      <td className="py-2.5 text-[#aaa] font-sans">Identificador único do documento</td>
                    </tr>
                    <tr className="bg-[#121212]">
                      <td className="py-2.5 font-bold text-amber-300">nome</td>
                      <td className="py-2.5 text-amber-400">String</td>
                      <td className="py-2.5 text-[#ddd]">"Treino de Musculação"</td>
                      <td className="py-2.5 text-[#bbb] font-sans">Nome legível da atividade</td>
                    </tr>
                    <tr className="bg-[#18140c] text-amber-200">
                      <td className="py-2.5 font-bold text-amber-400">categoria_id</td>
                      <td className="py-2.5 text-amber-400">String</td>
                      <td className="py-2.5 text-amber-300">"cat_fisica_01"</td>
                      <td className="py-2.5 text-[#ccc] font-sans">Permite filtros rápidos com .where()</td>
                    </tr>
                    <tr className="bg-[#18140c] text-amber-200">
                      <td className="py-2.5 font-bold text-amber-400">categoria_ref</td>
                      <td className="py-2.5 text-purple-400">Reference</td>
                      <td className="py-2.5 text-amber-300">categorias/cat_fisica_01</td>
                      <td className="py-2.5 text-[#ccc] font-sans">DocumentReference nativo Firestore</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-white">categoria_nome</td>
                      <td className="py-2.5 text-amber-400">String</td>
                      <td className="py-2.5 text-[#777]">"Atividade Física"</td>
                      <td className="py-2.5 text-[#aaa] font-sans">Desnormalização (evita joins lentos)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-white">recorrente</td>
                      <td className="py-2.5 text-emerald-400">Boolean</td>
                      <td className="py-2.5 text-[#777]">true / false</td>
                      <td className="py-2.5 text-[#aaa] font-sans">Define se entra no gerador de rotina diária</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-white">unidade</td>
                      <td className="py-2.5 text-amber-400">String</td>
                      <td className="py-2.5 text-[#777]">"minutos", "km", "páginas"</td>
                      <td className="py-2.5 text-[#aaa] font-sans">Unidade para registro no bot Telegram</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-white">afeta_meta</td>
                      <td className="py-2.5 text-emerald-400">Boolean</td>
                      <td className="py-2.5 text-[#777]">true</td>
                      <td className="py-2.5 text-[#aaa] font-sans">Se pontua para o cálculo do Score Geral</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-white">campos_extras</td>
                      <td className="py-2.5 text-cyan-400">Map / Dict</td>
                      <td className="py-2.5 text-[#777]">&#123;"foco": "hipertrofia"&#125;</td>
                      <td className="py-2.5 text-[#aaa] font-sans">Atributos flexíveis customizados</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Code Demonstration in Python */}
              <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#aaa]">
                  <Code className="w-4 h-4 text-amber-400" />
                  Como é feito o vínculo em Python (database.py):
                </div>
                <pre className="bg-[#080808] text-[#d4d4d4] border border-[#222] text-xs font-mono p-4 rounded-xl overflow-x-auto leading-relaxed">
{`# 1. Cria o objeto DocumentReference formal apontando para a categoria
categoria_ref = db.collection("categorias").document(categoria_id)

# 2. Salva o documento da atividade com a referência E com o id string
dados_atividade = {
    "nome": "Treino de Musculação",
    "categoria_id": categoria_id,            # Busca rápida (.where)
    "categoria_ref": categoria_ref,          # Referência nativa NoSQL (.get())
    "categoria_nome": cat_dados["nome"],     # Desnormalização para leitura veloz
    "unidade": "minutos",
    "recorrente": True,
    "afeta_meta": True
}

db.collection("atividades_cadastradas").add(dados_atividade)`}
                </pre>
              </div>
            </div>
          )}

          {activeCollection === 'categorias' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold font-mono text-amber-400">
                categorias
              </h3>
              <p className="text-xs text-[#888]">
                Define os pilares da rotina e os pesos relativos para o cálculo do Score ponderado (soma 100%).
              </p>
              <pre className="bg-[#080808] text-[#d4d4d4] border border-[#222] text-xs font-mono p-4 rounded-xl overflow-x-auto">
{`// Estrutura de Documento: categorias/{categoria_id}
{
  "nome": "Atividade Física",
  "unidade_padrao": "minutos",
  "peso_no_score": 30, // 30% do score geral
  "criado_em": Timestamp
}`}
              </pre>
            </div>
          )}

          {activeCollection === 'metas' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold font-mono text-emerald-400">
                metas (3 Níveis de Sucesso)
              </h3>
              <p className="text-xs text-[#888]">
                Regra de negócio: Mínimo (sucesso parcial), Ideal (100%), Excepcional (&gt;100%).
              </p>
              <pre className="bg-[#080808] text-[#d4d4d4] border border-[#222] text-xs font-mono p-4 rounded-xl overflow-x-auto">
{`// Estrutura de Documento: metas/{meta_id}
{
  "categoria_id": "cat_fisica_01",
  "periodo": "semanal",
  "niveis": {
    "minimo": 120,      // 2h de treino = 60% score
    "ideal": 180,       // 3h de treino = 100% score
    "excepcional": 240  // 4h de treino = 120% score bônus
  },
  "unidade": "minutos",
  "data_inicio": Timestamp,
  "data_fim": Timestamp
}`}
              </pre>
            </div>
          )}

          {activeCollection === 'instancias' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold font-mono text-amber-400">
                instancias_diarias (Registro de Hábitos)
              </h3>
              <p className="text-xs text-[#888]">
                Cada execução feita pelo usuário via Telegram bot ou PWA gera uma instância diária.
              </p>
              <pre className="bg-[#080808] text-[#d4d4d4] border border-[#222] text-xs font-mono p-4 rounded-xl overflow-x-auto">
{`// Estrutura de Documento: instancias_diarias/{instancia_id}
{
  "atividade_id": "ativ_musc_01",
  "data": "2026-03-07",
  "valor_registrado": 60, // ex: 60 minutos
  "status": "concluido",
  "origem": "telegram_bot",
  "substitui_atividade_id": null // Gestão de conflitos
}`}
              </pre>
            </div>
          )}

          {activeCollection === 'triagem' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold font-mono text-cyan-400">
                triagem_pendente (Entradas Rápidas)
              </h3>
              <p className="text-xs text-[#888]">
                Buffer de mensagens livres enviadas pelo usuário no Telegram quando ele está com pressa.
              </p>
              <pre className="bg-[#080808] text-[#d4d4d4] border border-[#222] text-xs font-mono p-4 rounded-xl overflow-x-auto">
{`// Estrutura de Documento: triagem_pendente/{id}
{
  "mensagem_bruta": "corri 4km hoje no parque",
  "chat_id": 123456789,
  "processado": false,
  "recebido_em": Timestamp
}`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
