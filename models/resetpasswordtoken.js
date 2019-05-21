'use strict';
module.exports = (sequelize, DataTypes) => {
  const ResetPasswordToken = sequelize.define('ResetPasswordToken', {
    token: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    expireTime: DataTypes.DATE,
    createdBy: DataTypes.INTEGER,
    updatedBy: DataTypes.INTEGER
  }, {});
  ResetPasswordToken.associate = function(models) {
    ResetPasswordToken.belongsTo(models.Users, {
      foreignKey: 'userId'
    });
  };
  return ResetPasswordToken;
};