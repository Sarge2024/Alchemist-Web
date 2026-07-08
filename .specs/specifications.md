# Especificações Técnicas e Funcionais: Alchemist Web

Este documento reúne o mapeamento completo da arquitetura, funcionalidades, integrações e requisitos técnicos do projeto **Alchemist Web**, servindo como documento de referência para todo o desenvolvimento futuro.

---

## 📅 Controle de Revisões

| Versão | Data       | Autor       | Descrição das Alterações |
| :---   | :---       | :---        | :---                     |
| **1.0**| 08/07/2026 | Antigravity | Inicialização do documento de especificações contendo o levantamento arquitetural, funcional e de integrações. Inclusão da especificação do Scanner de Pratos Multimodal. |

---

## 1. Visão Geral do Sistema

O **Alchemist Web** é um planejador e laboratório nutricional avançado voltado para a gestão alimentar individual e familiar. Suas principais premissas envolvem:
*   Planejamento de cardápios semanais dinâmicos (incluindo receitas de gastronomia molecular).
*   Geração inteligente de lista de compras vinculada aos planejamentos.
*   Gestão biométrica e de perfis de membros da família (alergias, restrições e metas de macros).
*   Rastreamento diário de consumo biológico.
*   **Novidade:** Scanner de Prato Multimodal que estima macros em refeições externas usando IA (Gemini) calibrada pelo peso do prato, integrada com uma base unificada (Supabase).

---

## 2. Arquitetura do Sistema

A aplicação está desenhada sob uma arquitetura de **BFF (Backend For Frontend)** para garantir segurança de chaves de API, agilidade no desenvolvimento e separação de conceitos.

```
┌─────────────────┐       ┌─────────────────┐       ┌────────────────────────┐
│  React (Vite)   │ ────> │ Express BFF     │ ────> │ Backend Principal      │
│  Frontend SPA   │ <──── │ (server.ts)     │ <──── │ (DishAlchemists API)   │
└─────────────────┘       └────────┬────────┘       └────────────────────────┘
                                   │
                                   ├───────────────> Google Gemini API
                                   │
                                   ├───────────────> Supabase (Base Nutricional)
                                   │
                                   └───────────────> Firebase (Auth & Firestore)
```

### 2.1. Frontend
*   **Tecnologia:** React 19 + TypeScript + Vite.
*   **Estilização:** Tailwind CSS v4.0.
*   **Animações:** Motion (antigo Framer Motion).
*   **Ícones:** Lucide React.
*   **Roteamento/Estado Visual:** Gerenciado por estado de exibição local (`ActiveView`) mapeado em `src/types.ts`.

### 2.2. Backend BFF (Backend for Frontend)
*   **Tecnologia:** Node.js + Express + tsx (TypeScript Execute).
*   **Porta padrão:** `3001` (com proxy do Vite em `/api`).
*   **Função:** Atuar como um proxy seguro para injetar tokens e chaves de API nas chamadas e executar processamentos complexos (como o pipeline do Gemini + Supabase) reduzindo a carga do cliente.

### 2.3. Armazenamento e APIs Externas
*   **Firebase Firestore:** Persistência de dados do cliente (perfis, histórico de consumo, listas de compras e planejamentos semanais).
*   **Supabase (PostgreSQL):** Utilizado especificamente para a base de dados de alimentos (TACO/USDA) e receitas globais por conta de capacidades de busca textual e indexação.
*   **DishAlchemists API:** Backend externo de receitas e ingredientes principais (`https://dishalchemists.com/api/v1/public`).
*   **Google Gemini API:** Integração através do SDK `@google/genai` (modelo `gemini-2.5-flash`) para segmentação e classificação de imagens de pratos.

---

## 3. Especificações Funcionais (Módulos)

### 3.1. Painel (Dashboard)
*   **Objetivo:** Consolidar a evolução e status diário do perfil ativo.
*   **Componentes:**
    *   Gráfico de progresso calórico e de macronutrientes (Proteínas, Carboidratos, Gorduras).
    *   Listagem de refeições consumidas no dia (Planejadas vs. Ocasionais).
    *   Exibição de alertas biométricos e de saúde.
    *   Histórico recente de peso.

### 3.2. Planejador Semanal (Cardápio)
*   **Objetivo:** Agendar as refeições da família para os 7 dias da semana.
*   **Recursos:**
    *   Mapeamento de períodos: Café da Manhã, Almoço, Café da Tarde, Jantar, Ceia.
    *   Mapeamento de tipos de prato: Entrada, Prato Principal, Sobremesa, Lanche, Bebida.
    *   Gestão de sobras ("leftovers") automáticas baseadas em regras de durabilidade.
    *   Opções de preparação: Cozimento em lote ("batch cooking") vs. Preparação diária ("daily").
    *   Escala de porções dinâmica.

### 3.3. Receitas (Recipe List & Detail)
*   **Objetivo:** Cadastro e busca de pratos.
*   **Filtros:** Busca por termo, categoria de prato, base de alimento e momento de consumo.
*   **Informações:** Tempo de preparo, dificuldade, ingredientes quantificados e valores de macronutrientes calculados automaticamente.

### 3.4. Lista de Compras (Shopping List)
*   **Objetivo:** Agrupar todos os ingredientes necessários para executar o planejamento da semana.
*   **Recursos:**
    *   Agrupamento automático por setores do mercado (Hortifruti, Laticínios & Ovos, Produtos Genéricos).
    *   Sincronização com o estado do planejador semanal (adicionar receitas gera ingredientes na lista).
    *   Adição manual de itens extras.
    *   Checklist interativo de progresso.

### 3.5. Scanner de Prato Calibrado (Plate Scanner)
*   **Objetivo:** Estimar o impacto nutricional de pratos consumidos fora de casa.
*   **Fluxo Técnico:**
    1.  O usuário captura a foto da refeição (utilizando a câmera do dispositivo via `capture="environment"`) e informa o peso líquido total em gramas.
    2.  O frontend envia os dados codificados em Base64 e o peso líquido para `/api/analyze-plate`.
    3.  O BFF solicita ao Gemini o reconhecimento dos ingredientes e a divisão percentual dos mesmos (garantindo soma = 100%).
    4.  O BFF pesquisa os ingredientes no Supabase (tabela `recipes` de fichas técnicas e `food_nutrition_base` de tabelas nutricionais oficiais).
    5.  O BFF executa o cálculo proporcional: `Peso_Ingrediente = (%_Gemini / 100) * Peso_Total`. Os nutrientes são calculados usando a regra de três sobre os valores por 100g recuperados do banco.
    6.  O frontend renderiza os alimentos encontrados e seus respectivos pesos, permitindo exclusão manual de falsos positivos com recalcular instantâneo de Kcal.

### 3.6. Scanner de Código de Barras (Product Scanner)
*   **Objetivo:** Cadastrar e identificar produtos industrializados.
*   **Tecnologia:** Biblioteca `html5-qrcode` integrada à câmera para decodificar códigos EAN.
*   **Integração:** Busca no BFF via `/api/products/barcode/:ean` integrando fontes externas (como Open Food Facts/USDA) ou cadastro manual.

### 3.7. Gestão de Família (Family Section)
*   **Objetivo:** Gestão de múltiplos perfis biológicos.
*   **Parâmetros de Perfil:** Nome, Avatar, Protocolos Dietéticos (ex: Vegano, Sem Lactose), Metas de Calorias e Macros, Alergias (ex: Amendoim) e Medicações/Suplementações ativas.

### 3.8. Histórico de Consumo
*   **Objetivo:** Listar logs passados e consolidados por dia para auditorias nutricionais.

---

## 4. Variáveis de Ambiente (.env)

O sistema requer a configuração das seguintes chaves de ambiente:

```bash
# Conexão Firebase (Utilizada no Frontend)
VITE_FIREBASE_API_KEY="sua-chave-api"
VITE_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="seu-projeto-id"
VITE_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="sender-id"
VITE_FIREBASE_APP_ID="app-id"
VITE_FIREBASE_MEASUREMENT_ID="measurement-id"

# Integração com BFF (Frontend -> Backend)
DISHALCHEMISTS_API_BASE="http://localhost:3001/api/v1/public" # Ou a URL de produção

# Chaves de API do Servidor (BFF - Server-side only)
DISHALCHEMISTS_API_KEY="sua-chave-secreta-do-alchemist"
GEMINI_API_KEY="sua-chave-do-google-gemini-ai"

# Supabase (Banco de Dados de Alimentos)
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_ANON_KEY="sua-anon-key-do-supabase"

# Chave Auxiliar USDA (Caso necessário)
USDA_API_KEY="sua-chave-usda-food-data"
```

---

## 5. Instruções de Desenvolvimento Local

1.  **Instalação:**
    ```bash
    npm install
    ```
2.  **Serviço Local (Desenvolvimento):**
    Utiliza concorrência para rodar simultaneamente o frontend (Vite na porta 3000) e o backend BFF (Express na porta 3001).
    ```bash
    npm run dev
    ```
3.  **Compilação de Produção:**
    ```bash
    npm run build
    ```
4.  **Verificação de Tipagens (TS):**
    ```bash
    npm run lint
    ```
