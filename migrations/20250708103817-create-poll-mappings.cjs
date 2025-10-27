'use strict';
// Этот файл должен использовать require/module.exports
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PollMappings', {
      telegramPollId: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      internalPollId: {
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
    await queryInterface.dropTable('PollMappings');
  }
};