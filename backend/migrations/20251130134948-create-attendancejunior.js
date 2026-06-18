'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Attendancejuniors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      aj_id: {
        type: Sequelize.STRING
      },
      aj_name: {
        type: Sequelize.STRING
      },
      aj_program: {
        type: Sequelize.STRING
      },
      aj_section: {
        type: Sequelize.STRING
      },
      aj_timein: {
        type: Sequelize.INTEGER
      },
      aj_timeout: {
        type: Sequelize.INTEGER
      },
      aj_date: {
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('Attendancejuniors');
  }
};