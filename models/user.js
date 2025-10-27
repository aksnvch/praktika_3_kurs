import { Model, DataTypes } from 'sequelize';

export default class User extends Model {
  static associate(models) {
  }
}

export const initUserModel = (sequelize) => {
  User.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    telegramId: { type: DataTypes.BIGINT, allowNull: false, unique: true },
    username: { type: DataTypes.STRING },
    firstName: { type: DataTypes.STRING },
    lastName: { type: DataTypes.STRING },
    isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    sequelize,
    modelName: 'User',
    timestamps: true,
  });
  return User;
};