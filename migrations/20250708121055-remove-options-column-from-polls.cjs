'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Polls', 'options');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Polls', 'options', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    });
  }
};