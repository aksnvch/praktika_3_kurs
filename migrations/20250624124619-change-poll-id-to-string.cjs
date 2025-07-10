'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('polls_temp', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      question: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      options: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      }
    });

    await queryInterface.sequelize.query(`
      INSERT INTO polls_temp 
      SELECT id::text, question, options, "isActive", "createdAt", "updatedAt" 
      FROM polls
    `);

    await queryInterface.dropTable('polls');

    await queryInterface.renameTable('polls_temp', 'polls');
  },

  async down(queryInterface) {
    throw new Error('This migration cannot be safely reverted');
  }
};