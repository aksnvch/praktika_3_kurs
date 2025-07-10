'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Удаляем старую колонку optionIndex
    await queryInterface.removeColumn('Votes', 'optionIndex');
    // Добавляем новую колонку optionId со ссылкой на Options
    await queryInterface.addColumn('Votes', 'optionId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Options',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },
  async down(queryInterface, Sequelize) {
    // Откатываем в обратном порядке
    await queryInterface.removeColumn('Votes', 'optionId');
    await queryInterface.addColumn('Votes', 'optionIndex', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  }
};