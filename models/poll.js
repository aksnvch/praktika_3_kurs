const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Poll', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    question: {
      type: DataTypes.STRING,
      allowNull: false
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    type: {
      type: DataTypes.ENUM('anonymous', 'quiz'),
      allowNull: false,
      defaultValue: 'anonymous'
    },
    correctOption: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      indexes: [{ fields: ['isActive'] }]
    },
    chatId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    messageId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false 
  });
};