import { Model, DataTypes } from 'sequelize';

export default class Poll extends Model {
  static associate(models) {
    this.hasMany(models.Vote, { foreignKey: 'pollId', onDelete: 'CASCADE' });
  }
}

export const initPollModel = (sequelize) => {
  Poll.init({
    id: { type: DataTypes.STRING, primaryKey: true },
    question: { type: DataTypes.STRING, allowNull: false },
    options: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    type: { type: DataTypes.ENUM('anonymous', 'quiz'), allowNull: false, defaultValue: 'anonymous' },
    correctOption: { type: DataTypes.INTEGER, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    chatId: { type: DataTypes.STRING, allowNull: true },
    messageId: { type: DataTypes.STRING, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    sequelize,
    modelName: 'Poll',
    timestamps: false
  });
  return Poll;
};