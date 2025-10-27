import { Model, DataTypes } from 'sequelize';

export default class Option extends Model {
  static associate(models) {
    this.belongsTo(models.Poll, { foreignKey: 'pollId' });
    this.hasMany(models.Vote, { foreignKey: 'optionId' });
  }
}

export const initOptionModel = (sequelize) => {
  Option.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    text: { type: DataTypes.STRING, allowNull: false },
    position: { type: DataTypes.INTEGER, allowNull: false },
    votes: { 
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    pollId: { type: DataTypes.STRING, allowNull: false }
  }, {
    sequelize,
    modelName: 'Option'
  });
  return Option;
};