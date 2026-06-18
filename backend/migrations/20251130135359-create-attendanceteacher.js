'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Attendanceteachers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      at_id: {
        type: Sequelize.STRING
      },
      at_name: {
        type: Sequelize.STRING
      },
      at_teacherlevel: {
        type: Sequelize.INTEGER
      },
      at_timein: {
        type: Sequelize.INTEGER
      },
      at_timeout: {
        type: Sequelize.INTEGER
      },
      at_date: {
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
    await queryInterface.dropTable('Attendanceteachers');
  }
};