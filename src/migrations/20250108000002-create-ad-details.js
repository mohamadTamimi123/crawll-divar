'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ad_details', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ad_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'scraped_ads',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      metraj: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      sal_sakht: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      otagh: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      tabaghe: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      parking: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      asansor: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      anbari: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      tozihat: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      location: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      image_links: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true
      },
      vadie: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      ejare: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      gheymat_kol: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      gheymat_har_metr: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      ghabele_tabdil: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('ad_details', ['ad_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ad_details');
  }
};
