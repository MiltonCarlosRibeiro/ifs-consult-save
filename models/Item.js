const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    tipo: { type: String, enum: ['W1', 'C1', 'C0', 'F', 'Outros'], required: true },
    codigo: { type: String, unique: true, required: true }, // ID imutável na lógica de negócio
    descricao: String,
    markup: { type: Number, default: 0 },
    custo: { type: Number, default: 0 },
    corDestaque: { type: String, default: 'transparent' },
    fabricacao: { type: String, enum: ['interno', 'externo'], default: 'interno' },
    fornecedores: [{
        nome: String,
        email: String,
        telefone: String,
        prazo: String, // ex: "5 dias"
    }],
    // Aqui acontece a mágica dos filhos de filhos
    filhos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    parentGroupId: String,
    desenhoPath: String
});

module.exports = mongoose.model('Item', ItemSchema);