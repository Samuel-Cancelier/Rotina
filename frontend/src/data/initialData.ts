import { Pilar, Categoria, PilarId } from '../types';

export const CORES_PILARES: Record<PilarId, string> = {
  pilar_atividade_fisica: '#10b981', // emerald-500
  pilar_estudos: '#3b82f6',          // blue-500
  pilar_trabalho: '#6c2efe',         // violet / roxo vibrante
  pilar_domesticas: '#f59e0b',       // amber-500
  pilar_diversos: '#64748b'          // slate-500
};

export const PILARES_INICIAIS: Pilar[] = [
  {
    id: 'pilar_atividade_fisica',
    numero: 1,
    nome: 'Atividade Física',
    descricao: 'Saúde e condicionamento físico',
    cor: CORES_PILARES.pilar_atividade_fisica,
    tem_meta: true,
    meta_pontos_mensal: 100,
    peso_no_score_geral: 40
  },
  {
    id: 'pilar_estudos',
    numero: 2,
    nome: 'Estudos e Leitura',
    descricao: 'Desenvolvimento intelectual e leitura',
    cor: CORES_PILARES.pilar_estudos,
    tem_meta: true,
    meta_pontos_mensal: 100,
    peso_no_score_geral: 40
  },
  {
    id: 'pilar_trabalho',
    numero: 3,
    nome: 'Trabalho',
    descricao: 'Horas de trabalho e projetos',
    cor: CORES_PILARES.pilar_trabalho,
    tem_meta: false,
    meta_pontos_mensal: 0,
    peso_no_score_geral: 0
  },
  {
    id: 'pilar_domesticas',
    numero: 4,
    nome: 'Domésticas',
    descricao: 'Organização e limpeza',
    cor: CORES_PILARES.pilar_domesticas,
    tem_meta: true,
    meta_pontos_mensal: 50,
    peso_no_score_geral: 20
  },
  {
    id: 'pilar_diversos',
    numero: 5,
    nome: 'Diversos',
    descricao: 'Atividades livres, lazer, espiritual',
    cor: CORES_PILARES.pilar_diversos,
    tem_meta: false,
    meta_pontos_mensal: 0,
    peso_no_score_geral: 0
  }
];

// As cores das categorias são estritamente as mesmas do Pilar ao qual pertencem (não mudam)
export const CATEGORIAS_INICIAIS: Categoria[] = [
  {
    id: 'cat_musculacao',
    pilar_id: 'pilar_atividade_fisica',
    nome: 'Musculação',
    unidade_padrao: 'treinos',
    pontos_por_unidade: 10,
    meta_mensal: 20,
    cor: CORES_PILARES.pilar_atividade_fisica,
    peso_no_score: 50
  },
  {
    id: 'cat_corrida',
    pilar_id: 'pilar_atividade_fisica',
    nome: 'Corrida',
    unidade_padrao: 'km',
    pontos_por_unidade: 2,
    meta_mensal: 30,
    cor: CORES_PILARES.pilar_atividade_fisica,
    peso_no_score: 25
  },
  {
    id: 'cat_futsal',
    pilar_id: 'pilar_atividade_fisica',
    nome: 'Futsal',
    unidade_padrao: 'horas',
    pontos_por_unidade: 10,
    meta_mensal: 4,
    cor: CORES_PILARES.pilar_atividade_fisica,
    peso_no_score: 25
  },
  {
    id: 'cat_leitura',
    pilar_id: 'pilar_estudos',
    nome: 'Leitura',
    unidade_padrao: 'páginas',
    pontos_por_unidade: 0.5,
    meta_mensal: 300,
    cor: CORES_PILARES.pilar_estudos,
    peso_no_score: 50
  },
  {
    id: 'cat_cursos',
    pilar_id: 'pilar_estudos',
    nome: 'Cursos',
    unidade_padrao: 'horas',
    pontos_por_unidade: 5,
    meta_mensal: 10,
    cor: CORES_PILARES.pilar_estudos,
    peso_no_score: 50
  },
  {
    id: 'cat_trabalho',
    pilar_id: 'pilar_trabalho',
    nome: 'Trabalho Fixo',
    unidade_padrao: 'horas',
    pontos_por_unidade: 1,
    meta_mensal: 160,
    cor: CORES_PILARES.pilar_trabalho,
    peso_no_score: 0
  },
  {
    id: 'cat_limpeza',
    pilar_id: 'pilar_domesticas',
    nome: 'Limpeza da Casa',
    unidade_padrao: 'vezes',
    pontos_por_unidade: 10,
    meta_mensal: 4,
    cor: CORES_PILARES.pilar_domesticas,
    peso_no_score: 100
  }
];
