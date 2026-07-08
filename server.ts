// server.ts — BFF (Backend For Frontend)
// Proxy seguro entre o frontend SPA e o backend Alchemist.
// Injeta x-api-key server-side para que a chave nunca seja exposta no browser.

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { findFoodInDatabase } from './server/services/supabase';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();
const PORT = 3001;

app.use(express.json({ limit: '10mb' }));

// ==========================================
// Configuração — API Key server-side only
// ==========================================
const DISH_API_BASE = process.env.DISHALCHEMISTS_API_BASE || 'http://localhost:4005/api/v1/public';
const DISH_API_KEY = process.env.DISHALCHEMISTS_API_KEY || '';

// Helper: headers padrão para comunicação com o backend Alchemist
function backendHeaders(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        'x-api-key': DISH_API_KEY
    };
}

// ==========================================
// Rotas Proxy — DishAlchemists Public API
// ==========================================

// GET /api/recipes — Lista receitas com paginação e filtros
app.get('/api/recipes', async (req, res) => {
    try {
        const { limit, page, search, category, difficulty } = req.query;
        const params = new URLSearchParams();
        if (limit) params.set('limit', limit as string);
        if (page) params.set('page', page as string);
        if (search) params.set('search', search as string);
        if (category) params.set('category', category as string);
        if (difficulty) params.set('difficulty', difficulty as string);
        
        const url = `${DISH_API_BASE}/recipes${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url, { headers: backendHeaders() });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (err: any) {
        console.error("Erro ao buscar receitas do DishAlchemists:", err.message);
        res.status(500).json({ error: "Falha na comunicação com DishAlchemists" });
    }
});

// GET /api/recipes/search — Busca textual (mapeia para /search no backend)
app.get('/api/recipes/search', async (req, res) => {
    try {
        const { q, limit } = req.query;
        const params = new URLSearchParams();
        if (q) params.set('q', q as string);
        if (limit) params.set('limit', limit as string);

        const response = await fetch(`${DISH_API_BASE}/search?${params.toString()}`, {
            headers: backendHeaders()
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (err: any) {
        console.error("Erro ao buscar receitas:", err.message);
        res.status(500).json({ error: "Falha na busca de receitas" });
    }
});

// GET /api/recipes/:id — Receita específica por ID
app.get('/api/recipes/:id', async (req, res) => {
    try {
        const response = await fetch(`${DISH_API_BASE}/recipes/${req.params.id}`, {
            headers: backendHeaders()
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (err: any) {
        console.error(`Erro ao buscar receita ${req.params.id}:`, err.message);
        res.status(500).json({ error: "Falha na comunicação com DishAlchemists" });
    }
});

// GET /api/categories — Categorias disponíveis
app.get('/api/categories', async (req, res) => {
    try {
        const response = await fetch(`${DISH_API_BASE}/categories`, {
            headers: backendHeaders()
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (err: any) {
        console.error("Erro ao buscar categorias:", err.message);
        res.status(500).json({ error: "Falha ao buscar categorias" });
    }
});

// GET /api/ingredients — Lista de ingredientes
app.get('/api/ingredients', async (req, res) => {
    try {
        const response = await fetch(`${DISH_API_BASE}/ingredients`, {
            headers: backendHeaders()
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (err: any) {
        console.error("Erro ao buscar ingredientes do DishAlchemists:", err.message);
        res.status(500).json({ error: "Falha na comunicação com DishAlchemists" });
    }
});

// ==========================================
// Motor Nutricional — Proxy para o backend
// ==========================================
app.post('/api/nutrition/calculate', async (req, res) => {
    try {
        const { ingredients } = req.body;
        if (!ingredients || !Array.isArray(ingredients)) {
            return res.status(400).json({ error: "Campo 'ingredients' inválido ou ausente. Precisa ser um array." });
        }

        // Proxeia para o backend Alchemist (onde TACO + USDA são consultadas com process.env)
        const response = await fetch(`${DISH_API_BASE.replace('/api/v1/public', '')}/api/nutrition/calculate`, {
            method: 'POST',
            headers: backendHeaders(),
            body: JSON.stringify({ ingredients })
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (err: any) {
        console.error("Erro no motor nutricional:", err.message);
        res.status(500).json({ error: "Erro interno no cálculo nutricional" });
    }
});

// ==========================================
// Produtos Industrializados — Proxy
// ==========================================
const PRODUCTS_API_BASE = process.env.DISHALCHEMISTS_API_BASE?.replace('/api/v1/public', '') || 'http://localhost:4005';

// GET /api/products/barcode/:ean — Busca produto pelo código de barras
app.get('/api/products/barcode/:ean', async (req, res) => {
    try {
        const response = await fetch(`${PRODUCTS_API_BASE}/api/v1/products/barcode/${req.params.ean}`, {
            headers: backendHeaders()
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err: any) {
        console.error("Erro ao buscar produto por barcode:", err.message);
        res.status(500).json({ error: "Falha ao buscar produto" });
    }
});

// POST /api/products — Cadastro manual de produto
app.post('/api/products', async (req, res) => {
    try {
        const response = await fetch(`${PRODUCTS_API_BASE}/api/v1/products`, {
            method: 'POST',
            headers: backendHeaders(),
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err: any) {
        console.error("Erro ao cadastrar produto:", err.message);
        res.status(500).json({ error: "Falha ao cadastrar produto" });
    }
});

// GET /api/products — Lista produtos com busca
app.get('/api/products', async (req, res) => {
    try {
        const { search, page, limit } = req.query;
        const params = new URLSearchParams();
        if (search) params.set('search', search as string);
        if (page) params.set('page', page as string);
        if (limit) params.set('limit', limit as string);

        const response = await fetch(`${PRODUCTS_API_BASE}/api/v1/products${params.toString() ? '?' + params.toString() : ''}`, {
            headers: backendHeaders()
        });
        const data = await response.json();
        res.json(data);
    } catch (err: any) {
        console.error("Erro ao listar produtos:", err.message);
        res.status(500).json({ error: "Falha ao listar produtos" });
    }
});

// ==========================================
// Multimodal Plate Scanner (Gemini + Supabase)
// ==========================================
app.post('/api/analyze-plate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, totalWeightGrams } = req.body;

    if (!imageBase64 || !totalWeightGrams) {
      res.status(400).json({ error: "Parâmetros 'imageBase64' e 'totalWeightGrams' são obrigatórios." });
      return;
    }

    const targetWeight = Number(totalWeightGrams);

    // 1. Solicitação de segmentação proporcional ao Gemini
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64.split(',')[1] || imageBase64
          }
        },
        `Analise visualmente a imagem deste prato. Identifique os alimentos presentes e estime a porcentagem de massa/peso que cada um representa em relação ao prato todo. 
        A soma de todas as porcentagens de 'estimatedWeightPercentage' DEVE fechar em exatamente 100.`
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dishName: { type: Type.STRING, description: "Nome comercial ou descritivo do prato." },
            items: {
              type: Type.ARRAY,
              description: "Lista de ingredientes/alimentos detectados individualmente.",
              items: {
                type: Type.OBJECT,
                properties: {
                  detectedName: { type: Type.STRING, description: "Nome do item em português (ex: Arroz cozido, Feijão preto)." },
                  estimatedWeightPercentage: { type: Type.NUMBER, description: "Porcentagem aproximada do peso total que este item ocupa (0 a 100)." }
                },
                required: ["detectedName", "estimatedWeightPercentage"]
              }
            }
          },
          required: ["dishName", "items"]
        } as Schema
      }
    });

    const resultText = aiResponse.text;
    if (!resultText) throw new Error("A IA falhou em responder.");
    const parsedAiResult = JSON.parse(resultText);

    // 2. Cruzamento de dados e enriquecimento via Banco de Dados (Supabase)
    const enrichedItems = [];
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;

    for (const item of parsedAiResult.items) {
      const calculatedWeight = Number(((item.estimatedWeightPercentage / 100) * targetWeight).toFixed(1));
      
      const dbMatch = await findFoodInDatabase(item.detectedName);

      if (dbMatch) {
        const itemCalories = Number(((dbMatch.calories_per_100g / 100) * calculatedWeight).toFixed(1));
        const itemCarbs = Number(((dbMatch.carbs_per_100g / 100) * calculatedWeight).toFixed(1));
        const itemProtein = Number(((dbMatch.protein_per_100g / 100) * calculatedWeight).toFixed(1));
        const itemFat = Number(((dbMatch.fat_per_100g / 100) * calculatedWeight).toFixed(1));

        totalCalories += itemCalories;
        totalCarbs += itemCarbs;
        totalProtein += itemProtein;
        totalFat += itemFat;

        enrichedItems.push({
          name: dbMatch.name,
          searchQuery: item.detectedName,
          weightGrams: calculatedWeight,
          percentage: item.estimatedWeightPercentage,
          calories: itemCalories,
          source: dbMatch.source,
          dbId: dbMatch.id,
          macronutrients: { carbsGrams: itemCarbs, proteinGrams: itemProtein, fatGrams: itemFat }
        });
      } else {
        enrichedItems.push({
          name: `${item.detectedName} (Não localizado no banco)`,
          searchQuery: item.detectedName,
          weightGrams: calculatedWeight,
          percentage: item.estimatedWeightPercentage,
          calories: 0,
          source: 'NÃO MAPEADO',
          dbId: null,
          macronutrients: { carbsGrams: 0, proteinGrams: 0, fatGrams: 0 }
        });
      }
    }

    // 3. Resposta Consolidada e Pronta para Renderização
    res.json({
      dishName: parsedAiResult.dishName,
      inputTotalWeight: targetWeight,
      items: enrichedItems,
      totalNutrients: {
        calories: Number(totalCalories.toFixed(1)),
        carbohydrates: Number(totalCarbs.toFixed(1)),
        protein: Number(totalProtein.toFixed(1)),
        lipids: Number(totalFat.toFixed(1))
      }
    });

  } catch (error) {
    console.error("Erro no processamento do prato:", error);
    res.status(500).json({ error: "Erro interno ao processar a pesagem computacional." });
  }
});

app.listen(PORT, () => {
    console.log(`BFF rodando em http://localhost:${PORT}`);
    console.log(`Proxeando para backend: ${DISH_API_BASE}`);
});
