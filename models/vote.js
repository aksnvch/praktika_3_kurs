const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Vote', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    pollId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Polls', 
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    optionIndex: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    indexes: [{ unique: true, fields: ['pollId', 'userId'] }]
  });
};