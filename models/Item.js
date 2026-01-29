const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    tipo: { 
        type: String, 
        enum: ['W1', 'C1', 'C0', 'F', 'Outros'], 
        required: true 
    },
    codigo: { 
        type: String, 
        unique: true, 
        required: true 
    }, // Identificador único e imutável
    descricao: String,
    markup: { type: Number, default: 0 },
    custo: { type: Number, default: 0 },
    corDestaque: { type: String, default: 'transparent' }, // Para grifar linhas
    fabricacao: { 
        type: String, 
        enum: ['interno', 'externo'], 
        default: 'interno' 
    },
    fornecedores: [{
        nome: String,
        email: String,
        telefone: String,
        prazo: String
    }],
    // Array de IDs que referenciam este mesmo Schema (Recursividade)
    filhos: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Item' 
    }],
    desenhoPath: String // Caminho para o PDF em assets/pdf/
}, { timestamps: true });

module.exports = mongoose.model('Item', ItemSchema);