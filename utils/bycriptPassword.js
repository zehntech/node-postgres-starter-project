const bcrypt = require('bcrypt-nodejs');

function hashPassword(str) {
    return bcrypt.hashSync(str);
}

function checkPassword(str, dbpass) {
    return bcrypt.compareSync(str, dbpass);
}

module.exports.hashPassword = hashPassword;
module.exports.checkPassword = checkPassword;