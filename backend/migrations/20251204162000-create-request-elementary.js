'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('request_elementaries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      re_id: {
        type: Sequelize.INTEGER
      },
      e_id: {
        type: Sequelize.STRING
      },
      old_program: {
        type: Sequelize.STRING
      },
      old_section: {
        type: Sequelize.STRING
      },
      new_program: {
        type: Sequelize.STRING
      },
      new_section: {
        type: Sequelize.STRING
      },
      reason: {
        type: Sequelize.TEXT
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
    await queryInterface.dropTable('request_elementaries');
  }
};