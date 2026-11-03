import { Pilar, Categoria, PilarId, Objetivo, ConfigGeral } from '../types';

export const CORES_PILARES: Record<PilarId, string> = {
  pilar_saude: '#10b981', // emerald
  pilar_intelectual: '#3b82f6', // blue
  pilar_profissional: '#8b5cf6', // violet
  pilar_criativo: '#ec4899', // pink
  pilar_casa: '#f59e0b' // amber
};

export const PILARES_INICIAIS: Pilar[] = [
  {
    id: 'pilar_saude',
    numero: 1,
    nome: 'Saúde & Físico',
    descricao: 'Força em casa, corrida e futsal — disciplina, longevidade e saúde mental',
    cor: CORES_PILARES.pilar_saude,
    peso_no_score_geral: 35
  },
  {
    id: 'pilar_intelectual',
    numero: 2,
    nome: 'Intelectual & Acadêmico',
    descricao: 'Graduação em ADS, estudo de tecnologia e leitura de não-ficção',
    cor: CORES_PILARES.pilar_intelectual,
    peso_no_score_geral: 30
  },
  {
    id: 'pilar_profissional',
    numero: 3,
    nome: 'Profissional & FEIT',
    descricao: 'Escalar a agência FEIT: SaaS, dashboards e automações',
    cor: CORES_PILARES.pilar_profissional,
    peso_no_score_geral: 15
  },
  {
    id: 'pilar_criativo',
    numero: 4,
    nome: 'Pessoal & Criativo',
    descricao: 'Pintura, violão/guitarra e repertório cultural — longe das telas',
    cor: CORES_PILARES.pilar_criativo,
    peso_no_score_geral: 15
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
    aliases: ['musculacao', 'forca', 'academia'],
    unidade: 'min',
    valor_padrao: 60,
    meta_semanal_sessoes: 3,
    meta_semanal_volume: 0,
    dias_planejados: [1, 2, 4],
    horario_sugerido: '18:30',
    duracao_min: 60,
    descricao: 'Força em casa (halteres, barra, kettlebell). Ex.: Peito + Ombro anterior; Costas + Bíceps + Ombro lat/post.'
  },
  {
    id: 'cat_corrida',
    pilar_id: 'pilar_saude',
    nome: 'Corrida',
    tag: 'Corrida',
    aliases: ['correr', 'run'],
    unidade: 'km',
    valor_padrao: 5,
    meta_semanal_sessoes: 2,
    meta_semanal_volume: 12,
    dias_planejados: [3, 5],
    horario_sugerido: '18:30',
    duracao_min: 45,
    descricao: 'Final do dia, fora dos dias de musculação. Transição trabalho → descanso.'
  },
  {
    id: 'cat_futsal',
    pilar_id: 'pilar_saude',
    nome: 'Futsal',
    tag: 'Futsal',
    aliases: ['futebol', 'bola'],
    unidade: 'min',
    valor_padrao: 90,
    meta_semanal_sessoes: 1,
    meta_semanal_volume: 0,
    dias_planejados: [6],
    horario_sugerido: '16:00',
    duracao_min: 90
  },
  {
    id: 'cat_estudo',
    pilar_id: 'pilar_intelectual',
    nome: 'Estudo focado',
    tag: 'Estudo',
    aliases: ['estudar', 'faculdade', 'ads', 'curso'],
    unidade: 'h',
    valor_padrao: 1.5,
    meta_semanal_sessoes: 3,
    meta_semanal_volume: 5,
    dias_planejados: [1, 3, 4],
    horario_sugerido: '20:30',
    duracao_min: 90,
    descricao: 'Faculdade (ADS), cursos de extensão, Python/Streamlit, tecnologias para a FEIT.'
  },
  {
    id: 'cat_leitura',
    pilar_id: 'pilar_intelectual',
    nome: 'Leitura',
    tag: 'Leitura',
    aliases: ['ler', 'livro'],
    unidade: 'páginas',
    valor_padrao: 25,
    meta_semanal_sessoes: 4,
    meta_semanal_volume: 100,
    dias_planejados: [1, 4, 6, 0],
    horario_sugerido: '21:30',
    duracao_min: 40,
    descricao: 'Não-ficção, ciência, história, neurociência e comportamento humano. Sem celular por perto.'
  },
  {
    id: 'cat_feit',
    pilar_id: 'pilar_profissional',
    nome: 'Projetos FEIT',
    tag: 'FEIT',
    aliases: ['saas', 'projeto', 'sprint'],
    unidade: 'h',
    valor_padrao: 3,
    meta_semanal_sessoes: 1,
    meta_semanal_volume: 3,
    dias_planejados: [6],
    horario_sugerido: '09:00',
    duracao_min: 180,
    descricao: 'Desenvolvimento SaaS (analisador NFC-e), dashboards, automações. Fora do expediente Cresol.'
  },
  {
    id: 'cat_pintura',
    pilar_id: 'pilar_criativo',
    nome: 'Pintura',
    tag: 'Pintura',
    aliases: ['pintar', 'arte'],
    unidade: 'min',
    valor_padrao: 60,
    meta_semanal_sessoes: 1,
    meta_semanal_volume: 0,
    dias_planejados: [2],
    horario_sugerido: '20:30',
    duracao_min: 60,
    descricao: 'Sem telas, foco no presente.'
  },
  {
    id: 'cat_musica',
    pilar_id: 'pilar_criativo',
    nome: 'Violão / Guitarra',
    tag: 'Violão',
    aliases: ['violao', 'guitarra', 'musica'],
    unidade: 'min',
    valor_padrao: 30,
    meta_semanal_sessoes: 1,
    meta_semanal_volume: 0,
    dias_planejados: [2],
    horario_sugerido: '21:30',
    duracao_min: 30
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
    dias_planejados: [0],
    horario_sugerido: '19:00',
    duracao_min: 30,
    descricao: 'Gerar o relatório no app, analisar com o Gemini e planejar a semana seguinte.'
  },
  {
    id: 'cat_casa',
    pilar_id: 'pilar_casa',
    nome: 'Organização da casa',
    tag: 'Casa',
    aliases: ['limpeza', 'faxina'],
    unidade: 'sessões',
    valor_padrao: 1,
    meta_semanal_sessoes: 1,
    meta_semanal_volume: 0,
    dias_planejados: [],
    duracao_min: 60
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
    descricao: 'Força em casa (seg/ter/qui) + corrida 2–3x/semana; preparo para o futsal de sábado.',
    status: 'ativo'
  },
  {
    id: 'obj_criativo',
    pilar_id: 'pilar_criativo',
    titulo: 'Equilibrar o digital com o analógico',
    descricao: 'Pintura, violão/guitarra e aprofundamento cultural como contraponto à rotina analítica.',
    status: 'ativo'
  }
];

export const CONFIG_INICIAL: ConfigGeral = {
  id: 'geral',
  contexto: `Trabalho fixo na Cresol durante o dia e toco a agência FEIT (SaaS como o analisador de NFC-e, dashboards e automações). Curso Análise e Desenvolvimento de Sistemas.

Pilares de execução:
- Musculação em casa (halteres, barras, kettlebells), hipertrofia e força — estritamente segunda, terça e quinta. Divisões: Peito + Ombro anterior; Costas + Bíceps + Ombro lateral/posterior.
- Corrida no fim do dia, 2–3x/semana, fora dos dias de musculação (quarta, sexta ou fim de semana). Serve para construir disciplina e como transição trabalho → descanso.
- Estudo (foco profundo): faculdade, cursos de extensão e tecnologias para a FEIT e o trabalho.
- Leitura: não-ficção, ciência, história e evolução humana.
- Pintura: descompressão sem telas, foco no momento presente.
- Futsal competitivo aos sábados (tarde/noite).

Semana ideal:
- Seg: Cresol + sprints FEIT | Musculação (Peito + Ombro anterior) | Estudo focado / Leitura
- Ter: Cresol + sprints FEIT | Musculação (Costas + Bíceps + Ombro lat/post) | Pintura / Violão
- Qua: Cresol + sprints FEIT | Corrida | Estudo / Jogos (CS2, simuladores)
- Qui: Cresol + sprints FEIT | Musculação | Estudo focado / Leitura
- Sex: Fechamento e planejamento | Corrida (2ª sessão) | Lazer com a parceira
- Sáb: SaaS / projetos FEIT | Futsal | Lazer / Leitura / Pintura
- Dom: Descanso ativo e revisão da semana | Corrida opcional | Preparação da semana

Diretrizes: o treino ou a corrida marcam o fim do turno de trabalho. Pintura, leitura e música longe do setup de trabalho e sem celular.`,
  nome_calendario: 'Rotina',
  checkin_inicio: ''
};
