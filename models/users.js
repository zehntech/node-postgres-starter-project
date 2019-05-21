'use strict';
module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define('Users', {
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    name: DataTypes.STRING,
    dob: DataTypes.DATE,
    gender: DataTypes.STRING,
    company_uen: DataTypes.STRING,
    profile_url: DataTypes.STRING,
    isEnabled: DataTypes.BOOLEAN,
    isPremium: DataTypes.BOOLEAN,
    isVerified: DataTypes.BOOLEAN
  }, {});
  Users.associate = function (models) {
    Users.belongsToMany(models.Authority, {
      through: 'UserAuthority',
      as: 'authority',
      foreignKey: 'userId'
    });
    Users.hasOne(models.VerificationToken, {
      as: 'verificationtoken',
      foreignKey: 'userId',
      foreignKeyConstraint: true
    });
    Users.hasMany(models.UserContact, {
      foreignKey: 'userId',
      as: 'usercontact'
    });
    Users.hasMany(models.ResetPasswordToken, {
      foreignKey: 'userId',
      as: 'resetpasswordtoken'
    });
  };
  return Users;
};