'use strict';
module.exports = (sequelize, DataTypes) => {
  const Authority = sequelize.define('Authority', {
    name: DataTypes.STRING
  }, {});
  Authority.associate = function (models) {
    Authority.belongsToMany(models.Users, {
      through: 'UserAuthority',
      as: 'users',
      foreignKey: 'authorityId'
    });
  };
  return Authority;
};