'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Options', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      text: {
        type: Sequelize.STRING(255), // Опции в Telegram до 100, 255 с запасом
        allowNull: false
      },
      position: {
        type: Sequelize.INTEGER, // Порядок опции (0, 1, 2...)
        allowNull: false
      },
      pollId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Polls',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Options');
  }
};