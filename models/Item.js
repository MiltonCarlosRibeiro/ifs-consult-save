const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  // Garante que o caminho seja absoluto e aponte para a pasta data na raiz
  storage: path.join(__dirname, '../data/database.sqlite'),
  logging: false
});

const Item = sequelize.define('Item', {
  tipo: { type: DataTypes.STRING, allowNull: false },
  codigo: { type: DataTypes.STRING, unique: true, allowNull: false },
  descricao: DataTypes.TEXT,
  markup: { type: DataTypes.FLOAT, defaultValue: 0 },
  custo: { type: DataTypes.FLOAT, defaultValue: 0 },
  corDestaque: { type: DataTypes.STRING, defaultValue: 'transparent' },
  fabricacao: { type: DataTypes.STRING, defaultValue: 'interno' },
  desenhoPath: DataTypes.STRING,
  parentId: { type: DataTypes.INTEGER, allowNull: true }
});

// Força a criação da tabela se ela não existir
sequelize.sync({ alter: true })
  .then(() => console.log('📂 Banco de dados SQLite sincronizado!'))
  .catch(err => console.error('❌ Erro ao sincronizar banco:', err));

module.exports = { Item, sequelize };