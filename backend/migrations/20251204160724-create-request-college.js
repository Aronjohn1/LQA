'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('request_colleges', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      rc_id: {
        type: Sequelize.INTEGER
      },
      c_id: {
        type: Sequelize.STRING
      },
      old_program: {
        type: Sequelize.STRING
      },
      old_year_block: {
        type: Sequelize.STRING
      },
      new_program: {
        type: Sequelize.STRING
      },
      new_year_block: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('request_colleges');
  }
};