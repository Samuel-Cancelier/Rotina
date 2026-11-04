// ============================================================
// Modelo de dados v2 — App Rotina
// "O Google planeja, o app cobra e mede, o Gemini analisa."
// ============================================================

export type PilarId =
  | 'pilar_saude'
  | 'pilar_intelectual'
  | 'pilar_profissional'
  | 'pilar_criativo'
  | 'pilar_casa';

export interface Pilar {
  id: PilarId;
  numero: number;
  nome: string;
  descricao: string;
  cor: string;
  peso_no_score_geral: number; // % (soma = 100)
}

/** Unidades com conversão automática (min <-> h). Outras são texto livre. */
export type Unidade = 'km' | 'páginas' | 'min' | 'h' | 'sessões' | string;

export interface Categoria {
  id: string;
  pilar_id: PilarId;
  nome: string;
  /** Tag usada no título do evento do Google Agenda: "[Corrida] ..." */
  tag: string;
  /** Outras grafias aceitas para a mesma tag (sem acento, minúsculas) */
  aliases: string[];
  unidade: Unidade;
  /** Quantidade sugerida no check-in quando o evento não informa */
  valor_padrao: number;
  meta_semanal_sessoes: number; // 0 = sem meta de frequência
  meta_semanal_volume: number; // 0 = sem meta de volume
  /** Dias planejados (0=Dom ... 6=Sáb). Usado quando a Agenda não está conectada */
  dias_planejados: number[];
  /** Horário sugerido para o Gemini criar o evento (HH:MM) */
  horario_sugerido?: string;
  /** Duração sugerida do evento em minutos */
  duracao_min?: number;
  descricao?: string;
  inativa?: boolean;
}

export type StatusRegistro = 'feito' | 'parcial' | 'nao_feito' | 'remarcado' | 'ignorado';
export type OrigemRegistro = 'agenda' | 'plano' | 'manual';

export const MOTIVOS = [
  'Cansaço',
  'Trabalho estourou',
  'Esqueci',
  'Imprevisto',
  'Saúde / dor',
  'Clima',
  'Sem vontade',
  'Outro'
] as const;

/** Um registro = uma execução (ou não-execução) de um hábito em um dia. */
export interface Registro {
  id: string;
  data: string; // YYYY-MM-DD
  hora?: string; // HH:MM (planejada)
  categoria_id: string;
  status: StatusRegistro;
  valor: number;
  unidade: string;
  titulo?: string; // título do evento ou descrição livre
  motivo?: string;
  nota?: string;
  origem: OrigemRegistro;
  /** "gcal:<eventId>" ou "plano:<data>:<categoria>" — evita perguntar duas vezes */
  ref_id?: string;
  criado_em?: string;
}

export type StatusObjetivo = 'ativo' | 'concluido' | 'pausado';

/** Objetivos de médio/longo prazo ("Prêmios") */
export interface Objetivo {
  id: string;
  pilar_id: PilarId;
  titulo: string;
  descricao?: string;
  prazo?: string; // YYYY-MM-DD
  status: StatusObjetivo;
}

export interface ConfigGeral {
  id: 'geral';
  /** Documento de contexto colado pelo usuário (vai no relatório e nas instruções do Gem) */
  contexto: string;
  /** Nome do calendário dedicado no Google Agenda */
  nome_calendario: string;
  /** Data a partir da qual o check-in passa a cobrar (YYYY-MM-DD) */
  checkin_inicio: string;
  /** Hash SHA-256 do PIN para sincronizar a autenticação na nuvem em qualquer aparelho */
  pin_hash?: string;
}

/** Evento do Google Agenda já interpretado */
export interface EventoAgenda {
  ref_id: string; // "gcal:<id>"
  calendario_id: string;
  titulo: string;
  tag: string | null; // tag normalizada extraída de "[Tag]"
  categoria_id: string | null;
  data: string; // YYYY-MM-DD
  hora?: string; // HH:MM
  inicio: string; // ISO
  fim: string; // ISO
  dia_inteiro: boolean;
  valor_planejado: number | null;
  descricao?: string;
}

/** Item que o check-in precisa perguntar (vindo da Agenda ou do plano semanal) */
export interface ItemPlanejado {
  ref_id: string;
  origem: 'agenda' | 'plano';
  data: string;
  hora?: string;
  titulo: string;
  categoria_id: string | null;
  tag?: string | null;
  valor_sugerido: number;
  terminou: boolean; // o horário já passou?
}
