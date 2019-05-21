'use strict';
module.exports = (sequelize, DataTypes) => {
  const VerificationToken = sequelize.define('VerificationToken', {
    token: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    expireTime: DataTypes.DATE,
    isVerified: DataTypes.BOOLEAN,
    createdBy: DataTypes.INTEGER,
    updatedBy: DataTypes.INTEGER
  }, {});
  VerificationToken.associate = function(models) {
    // associations can be defined here
  };
  return VerificationToken;
};