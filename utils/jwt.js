const jwt = require('jsonwebtoken');
const USER_JWT = require("../config/global_config").CONFIGS.JWT_USER;
const fs = require('fs');

function signUserToken(userData, exp) {
    return new Promise((resolve, rejecet) => {
        let config = {
            algorithm: USER_JWT.ALGORITHM,
        };
        if (exp) {
            config.expiresIn = exp
        }

        jwt.sign(userData, getUserPrivateKey(), config, (err, token) => {
            if (err) {
                return rejecet(err);
            }
            resolve(token);
        });
    });
}

function getUserPrivateKey() {
    return fs.readFileSync(USER_JWT.PRIVATE_KEY, 'utf-8');
}

function validateUserToken(req, res, next) {

    let token = req.headers["x-access-token"];
    const verifyOptions = {
        expiresIn: USER_JWT.expiresIn,
        algorithm: [USER_JWT.ALGORITHM],
    };
    jwt.verify(token, getUserPublicKey(), verifyOptions, function (err, decode) {
        if (err) {
            res.json({
                error: true,
                code: 401,
                message: "Forbidden :: " + err
            });
        } else {
            req.user = decode;
            next();
        }
    });
}

function getUserPublicKey() {
    return fs.readFileSync(USER_JWT.PUBLIC_KEY, 'utf-8');
}

module.exports.signUserToken = signUserToken;
module.exports.validateUserToken = validateUserToken;