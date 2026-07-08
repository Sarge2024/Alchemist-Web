# Walkthrough: Scanner de Prato Multimodal Calibrado (Gemini + Supabase)

Este documento registra a implementação e homologação da funcionalidade do Scanner de Prato Multimodal Calibrado no projeto Alchemist Web.

---

## 📅 Controle de Revisões

| Versão | Data       | Autor       | Descrição da Versão |
| :---   | :---       | :---        | :---                |
| **1.0**| 08/07/2026 | Antigravity | Versão inicial da funcionalidade. Código do BFF integrado ao Gemini e buscas no Supabase concluídas. Componente de UI e navegação implementados no Frontend. |

---

## 1. O que foi Implementado

A funcionalidade permite que usuários que estejam comendo fora de casa registrem rapidamente o prato tirando uma foto e informando o peso total (em gramas). O sistema analisa a proporção dos alimentos de forma computacional e busca as informações nutricionais oficiais em tempo real.

### 1.1. Alterações no Backend (BFF)
*   **Aumento de Limite de Payload:** O middleware do Express em `server.ts` foi atualizado para aceitar JSON de até `10mb` (`app.use(express.json({ limit: '10mb' }))`), essencial para receber fotos codificadas em Base64 vindas do cliente.
*   **Serviço do Supabase (`server/services/supabase.ts`):** 
    *   Criado o cliente de conexão.
    *   Implementada a função `findFoodInDatabase` para buscar termos no Supabase via correspondência textual (`ILIKE`), priorizando receitas próprias (`recipes`) e fazendo fallback para a tabela unificada (`food_nutrition_base`).
*   **Rota de Análise (`POST /api/analyze-plate`):**
    *   Envia a imagem codificada para a API do Gemini (`gemini-2.5-flash`) com instruções estritas para segmentar o prato em componentes e pesos percentuais, exigindo saída estruturada em JSON (somando 100%).
    *   Cruza os alimentos identificados com o Supabase.
    *   Aplica a matemática de proporção com base no peso líquido calibrado fornecido pelo usuário e retorna as calorias/macronutrientes totais e de cada item de forma unificada.

### 1.2. Alterações no Frontend (React)
*   **Cliente de API (`src/services/plateScannerApi.ts`):** Função wrapper tipada para envio e recepção dos dados do BFF.
*   **Componente do Scanner (`src/components/PlateScanner/PlateScanner.tsx`):**
    *   Interface refinada e moderna seguindo o padrão estético do Alchemist Web.
    *   Entrada de arquivo com `capture="environment"` para acionar automaticamente a câmera traseira do celular.
    *   Fluxo de carregamento dinâmico (Loader).
    *   Visualização detalhada dos alimentos com calorias e macros, permitindo a exclusão de falsos positivos pelo usuário com recalcular instantâneo das calorias totais.
*   **Navegação:** Adição de `SCANNER` ao `ActiveView` e links correspondentes na `Sidebar` (Desktop) e `BottomNav` (Mobile) para permitir acesso de ponta a ponta.

---

## 2. Status de Validação

*   **Tipagem e Compilação:** Executado teste de compilação via `npm run lint` (`tsc --noEmit`), que finalizou com sucesso (código de saída `0`), validando que todos os arquivos criados e modificados cumprem com os contratos de tipo do TypeScript do projeto.
*   **Dependências:** `@supabase/supabase-js` adicionado com sucesso às dependências do `package.json`.

---

## 3. Instruções para Implantação e Execução

1.  Garanta que as variáveis no `.env` estão preenchidas:
    *   `SUPABASE_URL`
    *   `SUPABASE_ANON_KEY`
    *   `GEMINI_API_KEY`
2.  Rode a aplicação localmente:
    ```bash
    npm run dev
    ```
3.  Acesse `http://localhost:3000` no browser e navegue até a guia **Scanner** na barra lateral.
