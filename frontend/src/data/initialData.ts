import { Pilar, Categoria, PilarId, Objetivo, ConfigGeral } from '../types';

export const CORES_PILARES: Record<PilarId, string> = {
  pilar_saude: '#10b981', // emerald
  pilar_intelectual: '#3b82f6', // blue
  pilar_profissional: '#8b5cf6', // violet
  pilar_criativo: '#ec4899', // pink (legado)
  pilar_casa: '#f59e0b' // amber
};

export const PILARES_INICIAIS: Pilar[] = [
  {
    id: 'pilar_saude',
    numero: 1,
    nome: 'Saúde & Físico',
    descricao: 'Força em casa, corrida e futsal — disciplina, longevidade e saúde mental',
    cor: CORES_PILARES.pilar_saude,
    peso_no_score_geral: 40
  },
  {
    id: 'pilar_profissional',
    numero: 2,
    nome: 'Profissional & FEIT',
    descricao: 'Escalar a agência FEIT: SaaS, dashboards e automações',
    cor: CORES_PILARES.pilar_profissional,
    peso_no_score_geral: 35
  },
  {
    id: 'pilar_intelectual',
    numero: 3,
    nome: 'Intelectual & Acadêmico',
    descricao: 'Graduação em ADS, estudo de tecnologia e leitura de não-ficção',
    cor: CORES_PILARES.pilar_intelectual,
    peso_no_score_geral: 20
  },
  {
    id: 'pilar_casa',
    numero: 5,
    nome: 'Casa & Organização',
    descricao: 'Revisão semanal, planejamento e organização da casa',
    cor: CORES_PILARES.pilar_casa,
    peso_no_score_geral: 5
  }
];

// Dias: 0=Dom 1=Seg 2=Ter 3=Qua 4=Qui 5=Sex 6=Sáb
export const CATEGORIAS_INICIAIS: Categoria[] = [
  {
    id: 'cat_musculacao',
    pilar_id: 'pilar_saude',
    nome: 'Musculação',
    tag: 'Treino',
    aliases: ['musculacao', 'forca', 'academia', 'musculação', 'treino'],
    unidade: 'min',
    valor_padrao: 45,
    meta_semanal_sessoes: 3,
    meta_semanal_volume: 0,
    dias_planejados: [],
    horario_sugerido: '18:30',
    duracao_min: 45,
    descricao: 'Força em casa (halteres, barra, kettlebell). Foco em consistência.'
  },
  {
    id: 'cat_corrida',
    pilar_id: 'pilar_saude',
    nome: 'Corrida',
    tag: 'Corrida',
    aliases: ['correr', 'run', 'trote', 'cardio'],
    unidade: 'km',
    valor_padrao: 2.5,
    meta_semanal_sessoes: 2,
    meta_semanal_volume: 5,
    dias_planejados: [],
    horario_sugerido: '18:30',
    duracao_min: 35,
    descricao: 'Meta de 5 km por semana (ex: 2x 2,5 km).'
  },
  {
    id: 'cat_futsal',
    pilar_id: 'pilar_saude',
    nome: 'Futsal',
    tag: 'Futsal',
    aliases: ['futebol', 'bola', 'pelada'],
    unidade: 'min',
    valor_padrao: 60,
    meta_semanal_sessoes: 1,
    meta_semanal_volume: 0,
    dias_planejados: [],
    horario_sugerido: '16:00',
    duracao_min: 60
  },
  {
    id: 'cat_estudo',
    pilar_id: 'pilar_intelectual',
    nome: 'Estudo',
    tag: 'Estudo',
    aliases: ['estudar', 'faculdade', 'ads', 'curso', 'estudos'],
    unidade: 'h',
    valor_padrao: 1.5,
    meta_semanal_sessoes: 0,
    meta_semanal_volume: 0,
    dias_planejados: [],
    horario_sugerido: '',
    duracao_min: 60,
    descricao: 'Estudo sob demanda (faculdade ADS, cursos e programação). Agendado ou registrado conforme necessidade/meta do mês, sem dias fixos na semana.'
  },
  {
    id: 'cat_leitura',
    pilar_id: 'pilar_intelectual',
    nome: 'Leitura',
    tag: 'Leitura',
    aliases: ['ler', 'livro', 'leitura'],
    unidade: 'páginas',
    valor_padrao: 5,
    meta_semanal_sessoes: 2,
    meta_semanal_volume: 10,
    dias_planejados: [],
    horario_sugerido: '21:30',
    duracao_min: 30,
    descricao: 'Meta inicial de 40 páginas por mês (~10 páginas por semana, ~5 págs por sessão).'
  },
  {
    id: 'cat_feit',
    pilar_id: 'pilar_profissional',
    nome: 'Projetos FEIT',
    tag: 'FEIT',
    aliases: ['saas', 'projeto', 'sprint', 'feit', 'programar'],
    unidade: 'h',
    valor_padrao: 3,
    meta_semanal_sessoes: 2,
    meta_semanal_volume: 6,
    dias_planejados: [],
    horario_sugerido: '09:00',
    duracao_min: 120,
    descricao: 'SaaS NFC-e e automações (meta de 6 horas por semana).'
  },
  {
    id: 'cat_revisao',
    pilar_id: 'pilar_casa',
    nome: 'Revisão semanal',
    tag: 'Revisão',
    aliases: ['revisao', 'planejamento', 'planejar'],
    unidade: 'sessões',
    valor_padrao: 1,
    meta_semanal_sessoes: 1,
    meta_semanal_volume: 0,
    dias_planejados: [],
    horario_sugerido: '19:00',
    duracao_min: 20,
    descricao: 'Gerar o relatório e planejar com o Gemini.'
  },
  {
    id: 'cat_geral',
    pilar_id: 'pilar_casa',
    nome: 'Compromissos Gerais',
    tag: 'Geral',
    aliases: ['compromisso', 'geral', 'consulta', 'medico', 'dentista', 'pessoal'],
    unidade: 'sessões',
    valor_padrao: 1,
    meta_semanal_sessoes: 0,
    meta_semanal_volume: 0,
    dias_planejados: [],
    duracao_min: 30,
    descricao: 'Eventos pessoais e tarefas livres capturados do Google Agenda.'
  }
];

export const OBJETIVOS_INICIAIS: Objetivo[] = [
  {
    id: 'obj_feit',
    pilar_id: 'pilar_profissional',
    titulo: 'Escalar e consolidar a FEIT',
    descricao: 'SaaS (analisador de NFC-e), dashboards e automações; evoluir na gestão de processos.',
    status: 'ativo'
  },
  {
    id: 'obj_ads',
    pilar_id: 'pilar_intelectual',
    titulo: 'Concluir a graduação em ADS',
    descricao: 'Mantendo aprendizado contínuo em Python/Streamlit, neurociência e comportamento humano.',
    status: 'ativo'
  },
  {
    id: 'obj_saude',
    pilar_id: 'pilar_saude',
    titulo: 'Disciplina física inegociável',
    descricao: 'Força em casa + corrida 2–3x/semana; preparo para o futsal de sábado.',
    status: 'ativo'
  }
];

export const CONFIG_INICIAL: ConfigGeral = {
  id: 'geral',
  contexto: `Trabalho fixo na Cresol durante o dia e toco a agência FEIT (SaaS como o analisador de NFC-e, dashboards e automações). Curso Análise e Desenvolvimento de Sistemas.

Pilares de execução:
- Musculação em casa (halteres, barras, kettlebells), hipertrofia e força.
- Corrida no fim do dia, 2–3x/semana. Serve para construir disciplina e como transição trabalho → descanso.
- Estudo (foco profundo): faculdade, cursos de extensão e tecnologias para a FEIT e o trabalho.
- Leitura: não-ficção, ciência, história e evolução humana.
- Futsal competitivo aos sábados (tarde/noite).

Diretrizes: o treino ou a corrida marcam o fim do turno de trabalho. Leitura longe do setup de trabalho e sem celular.`,
  nome_calendario: 'Rotina',
  checkin_inicio: ''
};
