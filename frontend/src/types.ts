export type PilarId =
  | 'pilar_atividade_fisica'
  | 'pilar_estudos'
  | 'pilar_trabalho'
  | 'pilar_domesticas'
  | 'pilar_diversos';

export interface Pilar {
  id: PilarId;
  numero: number;
  nome: string;
  descricao: string;
  cor: string;
  tem_meta: boolean;
  meta_pontos_mensal: number; // Ex: 60 pontos
  peso_no_score_geral: number; // Percentual no score geral (soma dos que têm meta = 100%)
}

export interface Categoria {
  id: string;
  pilar_id: PilarId;
  nome: string;
  descricao?: string;
  unidade_padrao: string; // Ex: km, horas, páginas, tarefas
  pontos_por_unidade: number; // Ex: 1 km = 3 pts; 1h futsal = 10 pts; 1 pág = 0.5 pts
  meta_mensal: number; // Meta pura em sua unidade (ex: 20 km, 100 págs, 160h)
  cor: string;
  icone?: string;
  criado_em?: string;
  peso_no_score?: number; // Percentual no score para a aba Metas
  inativa?: boolean;
}

export interface AtividadeCadastrada {
  id: string;
  nome: string;
  categoria_id: string;
  categoria_nome: string;
  pilar_id?: PilarId;
  recorrente: boolean;
  unidade: string;
  afeta_meta: boolean;
  campos_extras?: Record<string, any>;
  criado_em?: string;
}

export interface RegistroMensalCategoria {
  id: string;
  ano: number;
  mes: number; // 1 a 12
  categoria_id: string;
  categoria_nome: string;
  pilar_id: PilarId;
  valor_total: number; // ex: 28 km, 68 páginas
  unidade: string;
  atividades_breakdown: Record<string, number>;
  atualizado_em?: string;
}

export interface MetaCategoria {
  id: string;
  categoria_id: string;
  categoria_nome: string;
  periodo: 'mensal' | 'anual';
  niveis: {
    minimo: number;
    ideal: number;
    excepcional: number;
  };
  unidade: string;
  progresso_mes_atual: number;
}

export type TipoAgendamento = 'rotina' | 'pontual' | 'google_agenda';

export interface AgendamentoItem {
  id: string;
  tipo: TipoAgendamento;
  titulo: string;
  data: string; // YYYY-MM-DD
  hora_inicio?: string;
  hora_fim?: string;
  categoria_id?: string;
  categoria_nome?: string;
  cor?: string;
  pilar_id?: PilarId;
  atividade_id?: string;
  concluido?: boolean;
  tag_livre?: string;
  google_event_id?: string;
  local?: string;
  descricao?: string;
  link_reuniao?: string;
}
