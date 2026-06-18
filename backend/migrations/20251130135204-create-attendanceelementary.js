'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Attendanceelementaries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ae_id: {
        type: Sequelize.STRING
      },
      ae_name: {
        type: Sequelize.STRING
      },
      ae_program: {
        type: Sequelize.STRING
      },
      ae_section: {
        type: Sequelize.STRING
      },
      ae_timein: {
        type: Sequelize.INTEGER
      },
      ae_timeout: {
        type: Sequelize.INTEGER
      },
      ae_date: {
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
    await queryInterface.dropTable('Attendanceelementaries');
  }
};