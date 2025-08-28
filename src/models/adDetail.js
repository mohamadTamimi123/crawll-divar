'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AdDetail extends Model {
    static associate(models) {
      // Define associations here
      AdDetail.belongsTo(models.ScrapedAd, {
        foreignKey: 'adId',
        as: 'ad'
      });
    }
  }
  
  AdDetail.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    adId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'ad_id',
      references: {
        model: 'scraped_ads',
        key: 'id'
      }
    },
    metraj: DataTypes.STRING(100),
    salSakht: {
      type: DataTypes.STRING(100),
      field: 'sal_sakht'
    },
    otagh: DataTypes.STRING(100),
    tabaghe: DataTypes.STRING(100),
    parking: DataTypes.STRING(100),
    asansor: DataTypes.STRING(100),
    anbari: DataTypes.STRING(100),
    tozihat: DataTypes.TEXT,
    location: DataTypes.TEXT,
    imageLinks: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      field: 'image_links'
    },
    vadie: DataTypes.STRING(100),
    ejare: DataTypes.STRING(100),
    gheymatKol: {
      type: DataTypes.STRING(100),
      field: 'gheymat_kol'
    },
    gheymatHarMetr: {
      type: DataTypes.STRING(100),
      field: 'gheymat_har_metr'
    },
    ghabeleTabdil: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'ghabele_tabdil'
    }
  }, {
    sequelize,
    modelName: 'AdDetail',
    tableName: 'ad_details',
    timestamps: true,
    underscored: true,
  });
  
  return AdDetail;
};
