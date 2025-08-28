'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('cities', [
      {
        name: 'tehran',
        display_name: 'تهران',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'karaj',
        display_name: 'کرج',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('cities', null, {});
  }
};
