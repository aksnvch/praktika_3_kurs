import { Model, DataTypes } from 'sequelize';

export default class Vote extends Model {
  static associate(models) {
    this.belongsTo(models.Poll, { foreignKey: 'pollId' });
    this.belongsTo(models.Option, { foreignKey: 'optionId' });
  }
}

export const initVoteModel = (sequelize) => {
  Vote.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    pollId: { type: DataTypes.STRING, allowNull: false },
    userId: { type: DataTypes.STRING, allowNull: false },
    optionId: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    sequelize,
    modelName: 'Vote',
    timestamps: true,
    indexes: [{ unique: true, fields: ['pollId', 'userId'] }]
  });
  return Vote;
};