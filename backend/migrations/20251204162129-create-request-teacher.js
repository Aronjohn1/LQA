'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('request_teachers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      rt_id: {
        type: Sequelize.INTEGER
      },
      t_id: {
        type: Sequelize.STRING
      },
      old_teacherlevel: {
        type: Sequelize.INTEGER
      },
      new_teacherlevel: {
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('request_teachers');
  }
};