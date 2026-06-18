'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('request_instructors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ri_id: {
        type: Sequelize.INTEGER
      },
      i_id: {
        type: Sequelize.STRING
      },
      old_instructorlevel: {
        type: Sequelize.INTEGER
      },
      new_instructorlevel: {
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
    await queryInterface.dropTable('request_instructors');
  }
};