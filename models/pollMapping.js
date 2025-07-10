import { Model, DataTypes } from 'sequelize';

export default class PollMapping extends Model {
  static associate(models) {
    this.belongsTo(models.Poll, { foreignKey: 'internalPollId' });
  }
}

export const initPollMappingModel = (sequelize) => {
  PollMapping.init({
    telegramPollId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    internalPollId: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'PollMapping',
    timestamps: true,
  });
  return PollMapping;
};