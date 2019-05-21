'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserContact = sequelize.define('UserContact', {
    contactNumber: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    token: DataTypes.INTEGER,
    isVarified: DataTypes.BOOLEAN,
    isActive: DataTypes.BOOLEAN,
    createdBy: DataTypes.INTEGER,
    updatedBy: DataTypes.INTEGER
  }, {});
  UserContact.associate = function(models) {
    UserContact.belongsTo(models.Users, {
      foreignKey: 'userId'
    });
  };
  return UserContact;
};