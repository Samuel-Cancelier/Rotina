# Documentação Oficial: Sistema de Gestão de Rotina e Score

Este documento está dividido em duas partes:
1. **Visão Sistêmica e Analítica:** Voltada para o entendimento da arquitetura matemática, estrutura de dados e regras de negócio do sistema.
2. **Guia do Usuário:** Um manual prático de como navegar, configurar e utilizar o sistema no dia a dia.

---

## PARTE 1: Visão Sistêmica e Arquitetura Matemática

O sistema foi arquitetado em uma hierarquia estrita de 3 níveis para garantir escalabilidade, mantendo o cálculo do Score limpo e focado no que importa.

### 1. A Hierarquia de Dados

*   **Nível 1: Pilares (Soberanos)**
    *   **O que são:** As áreas macro da vida (ex: Atividade Física, Estudos, Domésticas). 
    *   **Propriedades:** Possuem um `peso_no_score_geral` (em %) e uma `meta_pontos_mensal`.
    *   **Regra de Negócio:** São fixos no código (estabilidade). O "Trabalho", por exemplo, pode ter peso zero e meta zero, servindo apenas para rastreamento de horas sem impactar o score comportamental.
*   **Nível 2: Categorias (Quantitativas)**
    *   **O que são:** Os hábitos centrais dentro de um pilar (ex: Corrida, Musculação, Leitura).
    *   **Propriedades:** Possuem uma `unidade_padrao` (km, horas, páginas), uma `meta_mensal` puramente quantitativa e um `fator de conversão (pontos_por_unidade)`.
    *   **Regra de Negócio:** Podem ser ativadas ou inativadas (soft delete). Se inativadas, o histórico de pontos e métricas passadas não se perde, garantindo a integridade dos dados estatísticos.
*   **Nível 3: Atividades (Descritivas)**
    *   **O que são:** As execuções específicas de uma categoria (ex: "Corrida no Parque", "Corrida na Esteira").
    *   **Propriedades:** São labels/tags para rastreamento granular e servem como âncora para integrações externas, como lançamentos via Telegram.

### 2. Motor de Cálculos e Score Ponderado

A grande sacada do sistema é como ele transforma unidades completamente diferentes (quilômetros, páginas lidas, idas à academia) em uma métrica unificada (Pontos) e, finalmente, em um Score Ponderado (% de Sucesso).

**Passo A: Conversão de Unidades para Pontos**
Quando uma atividade é registrada, ela gera pontos para a sua categoria com base no seu fator de conversão.
*   *Exemplo:* A categoria "Corrida" tem conversão de `2 pts / km`. Um registro de `5 km` gera `10 pontos`. A categoria "Musculação" tem conversão de `10 pts / treino`. Um treino gera `10 pontos`.

**Passo B: Agregação no Pilar (O Balde de Pontos)**
Todos os pontos gerados pelas categorias sobem para o Pilar.
*   *Fórmula:* `Total de Pontos do Pilar = Soma(Pontos de todas as categorias atreladas a ele no mês)`.
*   *Atingimento do Pilar:* `(Total de Pontos do Pilar / Meta Mensal do Pilar) * 100`. (Este valor é travado no máximo em 120% no cálculo do score, para evitar que um super-foco em um pilar maqueie o abandono de outro).

**Passo C: Score Geral Ponderado (A Métrica Principal)**
O Score Geral avalia o atingimento global do mês, respeitando a importância (peso) que o usuário deu para cada Pilar.
*   *Fórmula:* `Soma( Atingimento do Pilar % * (Peso do Pilar / 100) )`.
*   *Exemplo:* Se "Atividade Física" pesa 50% e o usuário atingiu 100% da meta, ele já garantiu 50/100 no Score Geral. Se "Domésticas" pesa 20% e ele fez metade da meta (50%), ele soma mais 10/100. Score atual: 60/100.

---

## PARTE 2: Guia do Usuário Final

Bem-vindo ao seu Sistema de Gestão de Rotina! Este painel foi desenhado para transformar os seus hábitos em dados mensuráveis sem engessar a sua rotina.

### Entendendo as Abas (Navegação)

1.  **Pilares (Visão Geral & Score):** 
    *   *O que é:* O coração do seu sistema. Aqui você vê o seu **Score Geral Ponderado** (a nota de 0 a 100 do seu mês) e o progresso das suas metas macro.
    *   *O que fazer aqui:* Clique no ícone de lápis ao lado de um Pilar para definir quantos pontos você quer atingir no mês e qual a importância (Peso %) desse Pilar na sua vida.

2.  **Categorias (A Régua de Medição):**
    *   *O que é:* Onde você define "como" vai ganhar pontos.
    *   *O que fazer aqui:* Crie novas categorias (ex: "Yoga", "Estudo de Inglês"). Configure qual é a unidade de medida (minutos, aulas, páginas) e, o mais importante, defina **quantos pontos** cada 1 unidade gera. É aqui também que você pode inativar um hábito antigo que não faz mais sentido.

3.  **Atividades (Os Seus Lançamentos):**
    *   *O que é:* Onde a vida real acontece. É a divisão mais específica do sistema.
    *   *O que fazer aqui:* Cadastre atividades específicas. Por exemplo, dentro da categoria "Musculação", crie as atividades "Treino A (Peito)", "Treino B (Costas)". Se quiser renomear uma atividade, basta passar o mouse em cima do nome dela e clicar no ícone de terminal!

4.  **Calendário (Visão Temporal):**
    *   *O que é:* Para agendamentos e visualização de quando as coisas foram feitas. Você pode marcar um hábito como concluído diretamente por aqui.

5.  **Analytics & Dashboard:**
    *   *O que é:* Quando você tiver meses de dados acumulados, essa aba vai gerar gráficos mostrando seus picos de produtividade, gargalos e distribuição do seu esforço.

### Primeiros Passos: Configurando o seu Mês

**Passo 1: Ajuste os pesos da sua vida (Aba Pilares)**
A soma dos pesos dos seus Pilares deve idealmente dar 100%. Se você quer focar muito em Saúde neste mês, coloque o Peso de "Atividade Física" em 50%, "Estudos" em 30% e "Domésticas" em 20%. Ajuste a Meta Mensal de pontos (ex: 100 pontos para Atividade Física).

**Passo 2: Dê valor aos seus hábitos (Aba Categorias)**
Vá em Categorias e edite a pontuação. Se você definiu que precisa de 100 pontos em Atividade Física no mês, defina as regras: 1km de corrida vale 2 pontos; 1 treino de musculação vale 10 pontos. O sistema fará a matemática para você durante o mês.

**Passo 3: Comece a lançar (Integração Bot - Futuro)**
Os lançamentos diários são as Atividades. Embora você possa gerenciá-las no painel, a arquitetura foi desenhada para que você, no futuro próximo, possa simplesmente mandar uma mensagem no Telegram (ex: `/feito corrida esteira 5`) e o sistema converterá isso em `10 pontos` para o seu pilar automaticamente, atualizando o seu Score Geral em tempo real.

### Dicas de Ouro
*   **Não apague a história:** Se você parou de fazer um curso, não exclua a categoria dele. Clique no lápis, marque como "Inativa" e salve. O histórico de pontos que você suou para conseguir permanecerá salvo!
*   **Pilares "Fantasmas":** O pilar de "Trabalho" tem peso 0 e meta 0 de propósito. Ele serve para você lançar e registrar suas horas trabalhadas no Analytics, mas sem que o "Trabalhar muito" ou "Trabalhar pouco" afete a nota do seu esforço em construção de hábitos.
