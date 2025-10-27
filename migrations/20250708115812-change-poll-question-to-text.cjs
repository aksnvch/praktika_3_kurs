'use strict';
module.exports = {
  async up (queryInterface, Sequelize) {
    // Меняем тип колонки question на TEXT, который не имеет жесткого ограничения по длине
    await queryInterface.changeColumn('Polls', 'question', {
      type: Sequelize.TEXT,
      allowNull: false
    });
  },

  async down (queryInterface, Sequelize) {
    // Возвращаем обратно, если нужно будет откатить миграцию
    await queryInterface.changeColumn('Polls', 'question', {
      type: Sequelize.STRING, // Sequelize.STRING по умолчанию это VARCHAR(255)
      allowNull: false
    });
  }
};