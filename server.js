const express = require('express');
const path = require('path');
const { Item } = require('./models/Item');

const app = express();

// --- CONFIGURAÇÕES ---
app.use(express.json());

// Servir arquivos estáticos (Ajustado para sua estrutura de pastas)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// --- ROTAS API ---

// 1. Salvar ou Atualizar
app.post('/api/itens', async (req, res) => {
    try {
        const { id, ...dados } = req.body;
        if (id) {
            await Item.update(dados, { where: { id } });
            const atualizado = await Item.findByPk(id);
            return res.status(200).json(atualizado);
        }
        const novoItem = await Item.create(dados);
        res.status(201).json(novoItem);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Erro ao salvar: Código já existe ou dados inválidos.' });
    }
});

// 2. Listar com Inteligência de Custos (Hierárquico)
app.get('/api/itens', async (req, res) => {
    try {
        const itens = await Item.findAll();
        const listaSimples = itens.map(i => i.get({ plain: true }));

        const processados = listaSimples.map(pai => {
            // Soma os custos de todos os descendentes (filhos diretos)
            const filhos = listaSimples.filter(f => f.parentId === pai.id);
            const custoFilhos = filhos.reduce((acc, curr) => acc + (curr.custo || 0), 0);
            
            pai.custoTotal = (pai.custo || 0) + custoFilhos;

            // Fórmula: Venda = Custo / (1 - Markup)
            if (pai.markup > 0 && pai.markup < 1) {
                pai.valorVenda = pai.custoTotal / (1 - pai.markup);
            } else {
                pai.valorVenda = pai.custoTotal;
            }
            return pai;
        });

        res.json(processados);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar estrutura de custos.' });
    }
});

// 3. Importação em Massa (Excel) com Prevenção de Erros
app.post('/api/itens/:paiId/filhos-bulk', async (req, res) => {
    try {
        const { paiId } = req.params;
        const listaComIdPai = req.body.map(item => ({ 
            ...item, 
            parentId: paiId,
            custo: item.custo || 0,
            markup: item.markup || 0
        }));
        
        // insertMany equivalente no Sequelize para performance
        const filhos = await Item.bulkCreate(listaComIdPai, { ignoreDuplicates: false });
        res.status(201).json(filhos);
    } catch (error) {
        console.error("Erro no Bulk:", error);
        res.status(500).json({ error: 'Erro ao importar Excel. Verifique se há códigos duplicados na planilha.' });
    }
});

// 4. Deletar com limpeza de órfãos
app.delete('/api/itens/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Item.destroy({ where: { id } });
        // Desvincula filhos para que não fiquem presos a um pai inexistente
        await Item.update({ parentId: null }, { where: { parentId: id } });
        res.status(200).json({ message: 'Item removido' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar.' });
    }
});

// --- INICIALIZAÇÃO ---
const PORT = 8091;
app.listen(PORT, () => {
    console.log(`
    🚀 Sistema Pakmatic Online
    📍 Endereço: http://localhost:${PORT}
    📂 Banco de Dados: SQLite (Pasta /data)
    `);
});