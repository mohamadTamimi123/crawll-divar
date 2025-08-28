'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ScrapedAd extends Model {
    static associate(models) {
      // Define associations here
      ScrapedAd.belongsTo(models.City, {
        foreignKey: 'cityId',
        as: 'city'
      });
      
      ScrapedAd.hasOne(models.AdDetail, {
        foreignKey: 'adId',
        as: 'details'
      });
    }
  }
  
  ScrapedAd.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    link: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    cityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'city_id',
      references: {
        model: 'cities',
        key: 'id'
      }
    },
    adType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'ad_type'
    }
  }, {
    sequelize,
    modelName: 'ScrapedAd',
    tableName: 'scraped_ads',
    timestamps: true,
    underscored: true,
  });
  
  return ScrapedAd;
};
