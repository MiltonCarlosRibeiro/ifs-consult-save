const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Item = require('./models/Item'); // Garante que o modelo recursivo seja usado

const app = express();

// Middlewares
app.use(express.json());
// Define a pasta public para arquivos estáticos (HTML)
app.use(express.static(path.join(__dirname, 'public')));
// Define a pasta assets para CSS, JS e Imagens
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Conexão MongoDB Local para Windows 11
mongoose.connect('mongodb://127.0.0.1:27017/ifs_consult')
    .then(() => console.log('✅ MongoDB conectado com sucesso!'))
    .catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

// --- ROTAS API ---

// 1. Salvar novo item (Pai) com trava de imutabilidade
app.post('/api/itens', async (req, res) => {
    try {
        const novoItem = new Item(req.body);
        const itemSalvo = await novoItem.save();
        res.status(201).json(itemSalvo);
    } catch (error) {
        res.status(400).json({ 
            error: 'Código já cadastrado ou dados inválidos.',
            detalhes: error.message 
        });
    }
});

// 2. Listar todos os itens
app.get('/api/itens', async (req, res) => {
    try {
        const itens = await Item.find().populate('filhos');
        res.json(itens);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar itens.' });
    }
});

const PORT = 8091;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});