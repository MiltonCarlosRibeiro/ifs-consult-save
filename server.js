const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use('/assets', express.static('assets'));

// Conexão MongoDB Local
mongoose.connect('mongodb://127.0.0.1:27017/ifs_consult')
    .then(() => console.log('MongoDB conectado!'))
    .catch(err => console.error('Erro ao conectar:', err));

// Rota para salvar novo item (Com trava de imutabilidade)
app.post('/api/itens', async (req, res) => {
    try {
        const novoItem = new Item(req.body);
        await novoItem.save();
        res.status(201).json(novoItem);
    } catch (error) {
        res.status(400).json({ error: 'Código já existe ou dados inválidos' });
    }
});

const PORT = 8091;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));