const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../data/database.sqlite'),
  logging: false
});

const Item = sequelize.define('Item', {
  tipo: { type: DataTypes.STRING, allowNull: false },
  codigo: { type: DataTypes.STRING, unique: true, allowNull: false },
  descricao: { type: DataTypes.TEXT },
  markup: { type: DataTypes.FLOAT, defaultValue: 0 },
  custo: { type: DataTypes.FLOAT, defaultValue: 0 },
  quantidade: { type: DataTypes.FLOAT, defaultValue: 1 }, 
  corDesc: { type: DataTypes.STRING, defaultValue: 'transparent' },
  corCusto: { type: DataTypes.STRING, defaultValue: 'transparent' },
  parentId: { type: DataTypes.INTEGER, allowNull: true },
  // Os 5 Status de Checklist
  checkCadastro: { type: DataTypes.BOOLEAN, defaultValue: false },
  checkEstrutura: { type: DataTypes.BOOLEAN, defaultValue: false },
  checkMP: { type: DataTypes.BOOLEAN, defaultValue: false },
  checkDOP: { type: DataTypes.BOOLEAN, defaultValue: false },
  checkRoteiro: { type: DataTypes.BOOLEAN, defaultValue: false }
});

sequelize.sync({ alter: true })
  .then(() => console.log('📂 Banco SQLite Sincronizado!'))
  .catch(err => console.error('❌ Erro:', err));

module.exports = { Item, sequelize };