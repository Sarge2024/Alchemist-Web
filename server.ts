// server.ts
import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors'; // Opcional: caso o Vite precise rodar em portas separadas sem proxy
import dotenv from 'dotenv';
import { NutritionalEngineService } from './src/services/NutritionalEngineService';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(express.json());

// Abre ou cria o arquivo de banco de dados local
const db = new sqlite3.Database('./taco.db', (err) => {
    if (err) console.error('Erro ao abrir o banco TACO:', err.message);
    else console.log('Conectado ao banco de dados SQLite local (taco.db).');
});

// Inicializa a tabela e insere dados falsos da TACO se estiver vazia
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS alimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao TEXT NOT NULL,
      categoria TEXT NOT NULL,
      energia_kcal REAL,
      proteina_g REAL,
      carboidrato_g REAL
    )
  `);

    db.get("SELECT COUNT(*) as count FROM alimentos", (err, row: any) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO alimentos (descricao, categoria, energia_kcal, proteina_g, carboidrato_g) VALUES (?, ?, ?, ?, ?)");
            stmt.run("Arroz, integral, cozido", "Cereais e derivados", 124, 2.6, 25.8);
            stmt.run("Feijão, carioca, cozido", "Leguminosas e derivados", 76, 4.8, 13.6);
            stmt.run("Frango, peito, sem pele, grelhado", "Carnes e derivados", 159, 32.0, 0);
            stmt.finalize();
            console.log("Dados iniciais da TACO inseridos com sucesso.");
        }
    });
});

// Rota 1: Listar alimentos (com filtro opcional por busca)
app.get('/api/alimentos', (req, res) => {
    const busca = req.query.busca ? `%${req.query.busca}%` : '%';
    db.all("SELECT * FROM alimentos WHERE descricao LIKE ?", [busca], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Rota 2: Obter detalhes de um alimento específico
app.get('/api/alimentos/:id', (req, res) => {
    db.get("SELECT * FROM alimentos WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Alimento não encontrado" });
        res.json(row);
    });
});

// ==========================================
// Rota DishAlchemists (Proxy / BFF)
// Oculta a API Key no backend
// ==========================================
const DISH_API_BASE = process.env.VITE_DISHALCHEMISTS_API_BASE || 'https://dishalchemists.com/api';
const DISH_API_KEY = process.env.VITE_DISHALCHEMISTS_API_KEY || '';

app.get('/api/recipes', async (req, res) => {
    try {
        // req.headers.authorization conteria o firebaseToken vindo do Frontend
        const response = await fetch(`${DISH_API_BASE}/recipes`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DISH_API_KEY}`
            }
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (err: any) {
        console.error("Erro ao buscar receitas do DishAlchemists:", err.message);
        res.status(500).json({ error: "Falha na comunicação com DishAlchemists" });
    }
});

app.get('/api/recipes/:id', async (req, res) => {
    try {
        const response = await fetch(`${DISH_API_BASE}/recipes/${req.params.id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DISH_API_KEY}`
            }
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (err: any) {
        console.error(`Erro ao buscar receita ${req.params.id}:`, err.message);
        res.status(500).json({ error: "Falha na comunicação com DishAlchemists" });
    }
});

app.get('/api/ingredients', async (req, res) => {
    try {
        const response = await fetch(`${DISH_API_BASE}/ingredients`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DISH_API_KEY}`
            }
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
// Rota de Motor Nutricional (Cálculo)
// ==========================================
app.post('/api/nutrition/calculate', async (req, res) => {
    try {
        const { ingredients } = req.body;
        if (!ingredients || !Array.isArray(ingredients)) {
            return res.status(400).json({ error: "Campo 'ingredients' inválido ou ausente. Precisa ser um array." });
        }
        
        const result = await NutritionalEngineService.calculateRecipeNutrition(ingredients);
        res.json(result);
    } catch (err: any) {
        console.error("Erro no motor nutricional:", err.message);
        res.status(500).json({ error: "Erro interno no cálculo nutricional" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});
