// migrations/XXXXXXXX-change-poll-id-to-string.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Создаем временную таблицу с новым типом
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

    // 2. Копируем данные
    await queryInterface.sequelize.query(`
      INSERT INTO polls_temp 
      SELECT id::text, question, options, "isActive", "createdAt", "updatedAt" 
      FROM polls
    `);

    // 3. Удаляем оригинальную таблицу
    await queryInterface.dropTable('polls');

    // 4. Переименовываем временную таблицу
    await queryInterface.renameTable('polls_temp', 'polls');
  },

  async down(queryInterface) {
    // Просто выбрасываем ошибку, так как обратное преобразование небезопасно
    throw new Error('This migration cannot be safely reverted');
  }
};