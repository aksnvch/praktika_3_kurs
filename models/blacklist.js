import { Model, DataTypes } from 'sequelize';

export default class Blacklist extends Model {
  static associate(models) {
  }
}

export const initBlacklistModel = (sequelize) => {
  Blacklist.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    telegramId: { type: DataTypes.BIGINT, allowNull: false, unique: true },
    reason: { type: DataTypes.STRING },
  }, {
    sequelize,
    modelName: 'Blacklist',
    timestamps: true,
    updatedAt: false,
  });
  return Blacklist;
};