'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Attendanceinstructors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ai_id: {
        type: Sequelize.STRING
      },
      ai_name: {
        type: Sequelize.STRING
      },
      ai_instructorlevel: {
        type: Sequelize.INTEGER
      },
      ai_timein: {
        type: Sequelize.INTEGER
      },
      ai_timeout: {
        type: Sequelize.INTEGER
      },
      ai_date: {
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
    await queryInterface.dropTable('Attendanceinstructors');
  }
};