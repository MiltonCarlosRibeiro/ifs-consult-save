const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Item = require('./models/Item'); // Importando o modelo refatorado

const app = express();

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Conexão MongoDB Local (Ajustado para Windows 11)
mongoose.connect('mongodb://127.0.0.1:27017/ifs_consult')
    .then(() => console.log('✅ MongoDB conectado com sucesso!'))
    .catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

// --- ROTAS API ---

// 1. Salvar novo item (Pai)
app.post('/api/itens', async (req, res) => {
    try {
        const novoItem = new Item(req.body);
        const itemSalvo = await novoItem.save();
        res.status(201).json(itemSalvo);
    } catch (error) {
        // Tratamento de erro para código duplicado (Imutabilidade)
        res.status(400).json({ 
            error: 'Código já cadastrado ou dados inválidos.',
            detalhes: error.message 
        });
    }
});

// 2. Listar todos os itens (para a consulta do Gerente)
app.get('/api/itens', async (req, res) => {
    try {
        const itens = await Item.find().populate('filhos');
        res.json(itens);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar itens.' });
    }
});

// 3. Adicionar um filho a um item pai
app.post('/api/itens/:paiId/filhos', async (req, res) => {
    try {
        const { paiId } = req.params;
        // Cria o item filho primeiro
        const novoFilho = new Item(req.body);
        const filhoSalvo = await novoFilho.save();

        // Atualiza o pai para incluir a referência do novo filho
        await Item.findByIdAndUpdate(paiId, { 
            $push: { filhos: filhoSalvo._id } 
        });

        res.status(201).json(filhoSalvo);
    } catch (error) {
        res.status(400).json({ error: 'Erro ao adicionar item filho.' });
    }
});

const PORT = 8091;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Item = require('./models/Item'); // Importando o modelo refatorado

const app = express();

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Conexão MongoDB Local (Ajustado para Windows 11)
mongoose.connect('mongodb://127.0.0.1:27017/ifs_consult')
    .then(() => console.log('✅ MongoDB conectado com sucesso!'))
    .catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

// --- ROTAS API ---

// 1. Salvar novo item (Pai)
app.post('/api/itens', async (req, res) => {
    try {
        const novoItem = new Item(req.body);
        const itemSalvo = await novoItem.save();
        res.status(201).json(itemSalvo);
    } catch (error) {
        // Tratamento de erro para código duplicado (Imutabilidade)
        res.status(400).json({ 
            error: 'Código já cadastrado ou dados inválidos.',
            detalhes: error.message 
        });
    }
});

// 2. Listar todos os itens (para a consulta do Gerente)
app.get('/api/itens', async (req, res) => {
    try {
        const itens = await Item.find().populate('filhos');
        res.json(itens);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar itens.' });
    }
});

// 3. Adicionar um filho a um item pai
app.post('/api/itens/:paiId/filhos', async (req, res) => {
    try {
        const { paiId } = req.params;
        // Cria o item filho primeiro
        const novoFilho = new Item(req.body);
        const filhoSalvo = await novoFilho.save();

        // Atualiza o pai para incluir a referência do novo filho
        await Item.findByIdAndUpdate(paiId, { 
            $push: { filhos: filhoSalvo._id } 
        });

        res.status(201).json(filhoSalvo);
    } catch (error) {
        res.status(400).json({ error: 'Erro ao adicionar item filho.' });
    }
});

const PORT = 8091;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});