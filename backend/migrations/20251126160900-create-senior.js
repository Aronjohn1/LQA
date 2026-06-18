'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Seniors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      s_id: {
        type: Sequelize.STRING
      },
      S_name: {
        type: Sequelize.STRING
      },
      s_program: {
        type: Sequelize.STRING
      },
      s_gradelevel: {
        type: Sequelize.INTEGER
      },
      s_section: {
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
    await queryInterface.dropTable('Seniors');
  }
};