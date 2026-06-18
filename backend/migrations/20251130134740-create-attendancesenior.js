'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Attendanceseniors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      as_id: {
        type: Sequelize.STRING
      },
      as_name: {
        type: Sequelize.STRING
      },
      as_program: {
        type: Sequelize.STRING
      },
      as_gradelevel: {
        type: Sequelize.STRING
      },
      as_section: {
        type: Sequelize.STRING
      },
      as_timein: {
        type: Sequelize.INTEGER
      },
      as_timeout: {
        type: Sequelize.INTEGER
      },
      as_date: {
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
    await queryInterface.dropTable('Attendanceseniors');
  }
};