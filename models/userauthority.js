'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserAuthority = sequelize.define('UserAuthority', {
    userId: DataTypes.INTEGER,
    authorityId: DataTypes.INTEGER,
    createdBy: DataTypes.INTEGER,
    updatedBy: DataTypes.INTEGER
  }, {});
  UserAuthority.associate = function(models) {
  };
  return UserAuthority;
};