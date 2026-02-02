const express = require('express');
const path = require('path');
const { Item } = require('./models/Item');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Rota para Salvar/Atualizar Item Individual
app.post('/api/itens', async (req, res) => {
    try {
        const { id, ...dados } = req.body;
        if(dados.codigo) dados.codigo = dados.codigo.toUpperCase().trim();
        if(dados.descricao) dados.descricao = dados.descricao.toUpperCase().trim();

        if (id) {
            await Item.update(dados, { where: { id } });
            return res.status(200).json(await Item.findByPk(id));
        }
        const novo = await Item.create(dados);
        res.status(201).json(novo);
    } catch (error) { 
        res.status(400).json({ error: 'Erro ao salvar: Código duplicado ou dados inválidos.' }); 
    }
});

// Listar Itens com Cálculo Recursivo de Custo e Preço de Venda
app.get('/api/itens', async (req, res) => {
    try {
        const itens = await Item.findAll();
        const lista = itens.map(i => i.get({ plain: true }));

        const calcularCustoBOM = (paiId) => {
            const filhos = lista.filter(f => f.parentId === paiId);
            return filhos.reduce((acc, f) => {
                const acumulado = (f.custo || 0) + calcularCustoBOM(f.id);
                return acc + (acumulado * (f.quantidade || 1));
            }, 0);
        };

        res.json(lista.map(item => {
            item.custoTotal = (item.custo || 0) + calcularCustoBOM(item.id);
            const m = item.markup || 0;
            item.valorVenda = (m > 0 && m < 1) ? item.custoTotal / (1 - m) : item.custoTotal;
            return item;
        }));
    } catch (e) { res.status(500).send(); }
});

// Importação em Massa amarrada ao Pai
app.post('/api/itens/:paiId/filhos-bulk', async (req, res) => {
    try {
        const { paiId } = req.params;
        const lista = req.body.map(i => ({ 
            ...i, 
            parentId: parseInt(paiId),
            codigo: i.codigo.toUpperCase(),
            descricao: i.descricao.toUpperCase()
        }));
        await Item.bulkCreate(lista, { ignoreDuplicates: true });
        res.status(201).send();
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/itens/:id', async (req, res) => {
    await Item.destroy({ where: { id: req.params.id } });
    res.status(200).send();
});

const PORT = 8091;
app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));