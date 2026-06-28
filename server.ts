// server.ts — BFF (Backend For Frontend)
// Proxy seguro entre o frontend SPA e o backend Alchemist.
// Injeta x-api-key server-side para que a chave nunca seja exposta no browser.

import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(express.json());

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

app.listen(PORT, () => {
    console.log(`BFF rodando em http://localhost:${PORT}`);
    console.log(`Proxeando para backend: ${DISH_API_BASE}`);
});
