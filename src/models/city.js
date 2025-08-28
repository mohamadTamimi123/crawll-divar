'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class City extends Model {
    static associate(models) {
      // Define associations here
      City.hasMany(models.ScrapedAd, {
        foreignKey: 'cityId',
        as: 'scrapedAds'
      });
    }
  }
  
  City.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    displayName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'display_name'
    }
  }, {
    sequelize,
    modelName: 'City',
    tableName: 'cities',
    timestamps: true,
    underscored: true,
  });
  
  return City;
};
