'use strict';
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Options', 'votes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  async down (queryInterface) {
    await queryInterface.removeColumn('Options', 'votes');
  }
};