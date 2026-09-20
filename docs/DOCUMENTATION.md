# 📘 Documentação Oficial: Sistema de Gestão de Rotina, Metas e Score

Este manual foi elaborado para servir tanto como referência técnica quanto como guia prático do usuário no dia a dia.

---

## 📑 Sumário
1. [Parte 1: Visão Sistêmica e Arquitetura Matemática](#parte-1-visão-sistêmica-e-arquitetura-matemática)
2. [Parte 2: Guia do Usuário – As 8 Abas do Painel Web](#parte-2-guia-do-usuário--as-8-abas-do-painel-web)
3. [Parte 3: Manual Completo do Bot no Telegram](#parte-3-manual-completo-do-bot-no-telegram)
4. [Parte 4: Banco de Dados Firebase Firestore & Boas Práticas](#parte-4-banco-de-dados-firebase-firestore--boas-práticas)

---

## PARTE 1: Visão Sistêmica e Arquitetura Matemática

O sistema utiliza uma hierarquia estrita de **3 níveis** para organizar a rotina e mensurar o progresso:

```
┌────────────────────────────────────────────────────────┐
│            NÍVEL 1: PILARES SOBERANOS                  │
│  (Grandes áreas de vida com Peso % e Meta em Pontos)   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          NÍVEL 2: CATEGORIAS QUANTITATIVAS             │
│   (Hábitos com unidade padrão e fator de conversão)    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           NÍVEL 3: ATIVIDADES SEGMENTADAS              │
│    (Execuções específicas: "Parque" vs "Esteira")      │
└────────────────────────────────────────────────────────┘
```

### 1.1 A Hierarquia de Dados

* **Nível 1: Pilares (Soberanos)**
  * **O que são:** As 5 grandes áreas da sua vida (*Atividade Física*, *Estudos e Leitura*, *Trabalho*, *Tarefas Domésticas*, *Diversos*).
  * **Propriedades:** Possuem um `peso_no_score_geral` (%) e uma `meta_pontos_mensal`.
  * **Configuração Flexível:** Você pode personalizar os pesos e metas de cada pilar diretamente na aba **Pilares** da interface web.
    * *Dica sobre o Pilar "Trabalho":* Você pode deixá-lo com Peso 0% e Meta 0 (caso queira utilizá-lo apenas para registrar horas de expediente sem afetar seu score pessoal) ou dar um peso ativo (ex: 30%) com meta (ex: 80 pts), caso queira que o trabalho componha sua nota do mês.
* **Nível 2: Categorias (Quantitativas)**
  * **O que são:** Os hábitos centrais dentro de um pilar (ex: *Musculação*, *Corrida*, *Leitura*, *Limpeza*).
  * **Propriedades:** Possuem uma `unidade_padrao` (km, treinos, páginas, horas, vezes), uma `meta_mensal` pura e um **fator de conversão** (`pontos_por_unidade`).
  * **Regra de Cores:** Cada categoria herda e preserva a identidade visual da cor do seu Pilar Soberano.
* **Nível 3: Atividades (Descritivas)**
  * **O que são:** As execuções específicas de uma categoria (ex: dentro de *Corrida*, você pode ter *Corrida no Parque* e *Esteira na Academia*).
  * **Propriedades:** Servem como âncora para os lançamentos via Telegram (`/feito`) e para o calendário de rotinas.

---

### 1.2 Motor de Cálculos e Score Ponderado

O sistema transforma unidades completamente diferentes (quilômetros corridos, páginas lidas, treinos de musculação) em uma pontuação unificada e, por fim, no **Score Geral (0 a 100)**.

#### Passo A: Conversão de Unidades em Pontos
Toda vez que você registra uma quantidade realizada de uma categoria, os pontos são calculados:
$$\text{Pontos Gerados} = \text{Quantidade Lançada} \times \text{Pontos por Unidade}$$

* *Exemplo 1:* Categoria "Corrida" (1 km = 2 pts) ➔ Ao correr 5 km: $5 \times 2 = 10 \text{ pontos}$.
* *Exemplo 2:* Categoria "Musculação" (1 treino = 10 pts) ➔ Ao fazer 1 treino: $1 \times 10 = 10 \text{ pontos}$.
* *Exemplo 3:* Categoria "Leitura" (1 pág = 0.5 pts) ➔ Ao ler 30 págs: $30 \times 0.5 = 15 \text{ pontos}$.

#### Passo B: Agregação no Pilar Soberano
Todos os pontos das categorias atreladas ao pilar sobem para o "balde" mensal do pilar:
$$\text{Total de Pontos do Pilar} = \sum \text{Pontos de todas as categorias do Pilar no mês}$$
$$\text{Atingimento do Pilar (\%)} = \left( \frac{\text{Total de Pontos do Pilar}}{\text{Meta Mensal do Pilar}} \right) \times 100$$

> [!NOTE]
> **A Trava de Equilíbrio (Cap de 120%):**
> Para o cálculo do Score Geral, o atingimento de cada pilar é limitado em no máximo **120%**. Isso impede que um super-foco exagerado em um único pilar (ex: correr 300% da meta de Atividade Física) mascare o abandono total de outros pilares (como Estudos ou Tarefas Domésticas).

#### Passo C: Score Geral Ponderado (Nota do Mês)
O Score Geral avalia o atingimento global do mês respeitando os pesos atribuídos a cada pilar:
$$\text{Score Geral} = \frac{\sum (\text{Atingimento do Pilar \% (travado em 120)} \times \text{Peso do Pilar})}{\sum \text{Pesos dos Pilares com Meta}}$$

---

## PARTE 2: Guia do Usuário – As 8 Abas do Painel Web

O painel web (`http://localhost:3000`) foi projetado com uma interface escura e moderna para visualização intuitiva:

### 1. 🛡️ Aba Pilares
* **O que você vê:** O velocímetro do seu **Score Geral Ponderado**, o resumo de pontos conquistados versus a meta em cada pilar e gráficos comparativos.
* **O que fazer:** Clique no botão de edição de pesos/metas para ajustar a importância de cada pilar na sua vida. A soma ideal dos pesos dos pilares com meta é 100%.

### 2. 📁 Aba Categorias
* **O que você vê:** A lista de todos os seus hábitos quantitativos, com barras de progresso, meta em unidade pura e total de pontos gerados no mês.
* **O que fazer:** Crie novos hábitos (botão "Nova Categoria"), edite fatores de conversão (ex: mudar de 2 para 3 pts/km) ou filtre por pilar.

### 3. 📌 Aba Atividades
* **O que você vê:** A segmentação das atividades vinculadas a cada categoria.
* **O que fazer:** Cadastre novas rotinas específicas (ex: "Treino A - Peito e Tríceps") e defina se a atividade é recorrente e se afeta a meta.

### 4. 📅 Aba Calendário
* **O que você vê:** Calendário mensal interativo com seus compromissos e hábitos do dia.
* **O que fazer:**
  * **Agendar Rotina:** Agende a execução de uma atividade cadastrada para uma data específica.
  * **Agendar Pontual:** Crie lembretes ou tarefas avulsas (ex: "Consulta médica às 15h").
  * **Marcar como Concluído:** Clique no checkbox para dar baixa na tarefa.

### 5. 📋 Aba Lançamentos (Histórico)
* **O que você vê:** Tabela com todos os lançamentos individuais realizados no sistema (seja pelo Bot do Telegram ou pela Web).
* **O que fazer:**
  * **Lançamento Rápido:** Registre uma atividade realizada diretamente pelo painel.
  * **Edição de Quantidade:** Corrija um valor lançado errado com recálculo imediato dos pontos.
  * **Exclusão:** Exclua um lançamento acidental (os pontos são deduzidos automaticamente do seu pilar).

### 6. 🤖 Aba Telegram Bot (Simulador)
* **O que você vê:** Um simulador em tempo real de chat do Telegram dentro da própria interface web.
* **O que fazer:** Teste comandos do bot (como `/feito`, `/score`, `/agenda`) diretamente pelo navegador sem precisar pegar o celular.

### 7. 📊 Aba Analytics & Dashboard
* **O que você vê:** Gráficos analíticos de evolução:
  * **Visão Semanal:** Distribuição de hábitos por dia da semana (Segunda a Domingo).
  * **Visão Mensal:** Progresso consolidado do mês selecionado.
  * **Visão Anual:** Balanço comparativo mês a mês ao longo de todo o ano.

### 8. 🗄️ Aba Banco (Schema)
* **O que você vê:** Um guia interativo e educativo da modelagem de dados no Firebase Firestore, explicando a estrutura NoSQL das coleções (`pilares`, `categorias`, `atividades_cadastradas`, `registros_mensais`, `agendamentos`, `historico_atividades`).

---

## PARTE 3: Manual Completo do Bot no Telegram

O bot do Telegram permite que você mantenha seu sistema 100% atualizado com zero atrito, direto do seu celular.

### 🔹 1. Comando `/feito` (Lançamento Rápido)
Use para registrar um hábito que você acabou de realizar:
```text
/feito [categoria] [atividade] [quantidade]
```
* **Exemplos práticos:**
  * `/feito corrida Parque 5` ➔ Registra 5 km de corrida no Parque e gera pontos imediatos para o pilar Atividade Física.
  * `/feito leitura Habitos 30` ➔ Registra 30 páginas do livro Hábitos e pontua no pilar Estudos.
  * `/feito futsal Pelada 1.5` ➔ Registra 1.5 horas de jogo de futebol.
  * `/feito musculacao TreinoA 1` ➔ Registra 1 treino de musculação.

### 🔹 2. Comando `/score`
Exibe seu relatório consolidado de desempenho no mês atual:
* Exibe a nota geral de 0 a 100.
* Exibe a barra de status de cada Pilar (🟢 Verde se atingiu $\ge 80\%$, 🟡 Amarelo se $\ge 50\%$, 🔴 Vermelho se abaixo).

### 🔹 3. Comando `/agenda` e `/agendamentos`
* `/agenda` ➔ Exibe todas as tarefas e rotinas agendadas para **hoje**. Cada item vem acompanhado de um botão inline para você marcar como concluído com 1 toque!
* `/agendamentos` ➔ Exibe todos os agendamentos pendentes futuros.

### 🔹 4. Comando `/agendar [texto]`
Cria um compromisso pontual no seu calendário:
```text
/agendar Dentista amanhã às 14h
```

### 🔹 5. Comando `/rotina`
Abre um menu com botões interativos no Telegram para você escolher uma Categoria e agendar uma Atividade cadastrada para o seu dia.

### 🔹 6. Comando `/nova_atividade`
Inicia um assistente passo a passo no Telegram para cadastrar uma nova atividade com botões interativos.

### 🔹 7. Comandos de Consulta
* `/pilares` ➔ Lista os 5 Pilares, suas metas de pontos e pesos atuais.
* `/categorias` ➔ Lista todas as categorias e regras de conversão.
* `/atividades` ➔ Lista as atividades já cadastradas.

---

## PARTE 4: Banco de Dados Firebase Firestore & Boas Práticas

Os seus dados ficam armazenados na nuvem do **Google Cloud Firebase Firestore** (Projeto `rotina-94433`).

### Principais Coleções:
1. **`pilares`**: Documentos com IDs fixos (`pilar_atividade_fisica`, `pilar_estudos`, etc.) contendo pesos e metas.
2. **`categorias`**: Categorias cadastradas com nome, unidade, fator de pontos e pilar pai.
3. **`atividades_cadastradas`**: Atividades com a tríade de vínculo (`categoria_id`, `categoria_nome` e `pilar_id`).
4. **`registros_mensais`**: Agrupamentos mensais com ID no formato `reg_ANO_MES_categoriaId` (ex: `reg_2026_09_cat_corrida`). Armazena o valor acumulado no mês e o desdobramento por atividade (`atividades_breakdown`).
5. **`historico_atividades`**: Registros individuais de cada `/feito` com data/hora, quantidade e pontos gerados.
6. **`agendamentos`**: Tarefas e eventos do calendário com status de conclusão.

### Dicas de Boas Práticas:
* **Não apague a história:** Em vez de excluir categorias antigas com meses de registros, edite o nome ou inative-a para manter seu histórico de anos anteriores intacto no Analytics.
* **Consistência de Nomes:** Ao lançar `/feito corrida Parque 5`, use sempre o mesmo nome de atividade para que o sistema agrupe corretamente suas estatísticas.

