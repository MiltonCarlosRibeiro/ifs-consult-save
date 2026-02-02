const express = require('express');
const path = require('path');
const { Item } = require('./models/Item');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Rota de Cálculo: Roll-up de Custos (Regra do Carrinho)
app.get('/api/itens', async (req, res) => {
    try {
        const itens = await Item.findAll();
        const lista = itens.map(i => i.get({ plain: true }));

        const calcularValores = (item) => {
            const filhos = lista.filter(f => f.parentId === item.id);
            
            if (filhos.length === 0) {
                // Item individual (Folha)
                item.custoAgrupado = item.custo || 0;
            } else {
                // Soma a venda dos filhos para compor o custo do pai (Lógica do Carrinho)
                item.custoAgrupado = filhos.reduce((acc, f) => {
                    return acc + (calcularValores(f) * (f.quantidade || 1));
                }, 0);
            }
            
            const m = item.markup || 0;
            // Fórmula Comercial: Venda = Custo / (1 - Markup)
            item.vendaFinal = (m > 0 && m < 1) ? item.custoAgrupado / (1 - m) : item.custoAgrupado;
            return item.vendaFinal;
        };

        res.json(lista.map(item => { calcularValores(item); return item; }));
    } catch (e) { res.status(500).send(); }
});

// Salvar ou Editar Item Individual
app.post('/api/itens', async (req, res) => {
    try {
        const { id, ...dados } = req.body;
        if(dados.codigo) dados.codigo = dados.codigo.toUpperCase().trim();
        if(dados.descricao) dados.descricao = dados.descricao.toUpperCase().trim();

        if (id) {
            await Item.update(dados, { where: { id } });
            return res.status(200).json(await Item.findByPk(id));
        }
        res.status(201).json(await Item.create(dados));
    } catch (error) { res.status(400).json({ error: 'Erro ao salvar.' }); }
});

// Persistência em Massa (Bulk) - Permite duplicatas amarradas ao Pai
app.post('/api/itens/:paiId/filhos-bulk', async (req, res) => {
    try {
        const { paiId } = req.params;
        const lista = req.body.map(i => ({ 
            ...i, 
            parentId: parseInt(paiId), // Encapsula os itens pelo ID do pai atual
            codigo: i.codigo.toUpperCase().trim(),
            descricao: i.descricao.toUpperCase().trim()
        }));
        
        // Inserção em massa permitindo códigos que já existam em outros pais
        await Item.bulkCreate(lista); 
        res.status(201).send();
    } catch (e) { 
        res.status(500).json({error: e.message}); 
    }
});

// Excluir Item
app.delete('/api/itens/:id', async (req, res) => {
    await Item.destroy({ where: { id: req.params.id } });
    res.status(200).send();
});

// Inicialização com Link Clicável
const PORT = 8091;
app.listen(PORT, () => {
    console.log(`\n🚀 Sistema rodando com sucesso!`);
    console.log(`🔗 Link de acesso: http://localhost:${PORT}\n`);
});