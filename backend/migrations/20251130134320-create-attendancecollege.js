'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Attendancecolleges', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ac_id: {
        type: Sequelize.STRING
      },
      ac_name: {
        type: Sequelize.STRING
      },
      ac_program: {
        type: Sequelize.STRING
      },
      ac_year_block: {
        type: Sequelize.STRING
      },
      ac_timein: {
        type: Sequelize.INTEGER
      },
      ac_timeout: {
        type: Sequelize.INTEGER
      },
      ac_date: {
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
    await queryInterface.dropTable('Attendancecolleges');
  }
};