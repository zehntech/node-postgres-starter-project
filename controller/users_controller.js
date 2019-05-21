const User = require('../models').Users;
const Authority = require('../models').Authority;
const UserAuthority = require('../models').UserAuthority;
const Utils = require('../utils/utils');
const Passowrd = require('../utils/bycriptPassword');
const ConfigsApi = require("../config/global_config").CONFIGS.API;
const MAILER = require('../utils/mailer');
const CryptoRandomString = require('crypto-random-string');
const VerificationToken = require('../models').VerificationToken;
const TOKEN = require('../utils/jwt');
const USER_JWT = require("../config/global_config").CONFIGS.JWT_USER;
const Twilio = require('../config/global_config').CONFIGS.twilio;
const UserContact = require('../models').UserContact;
const ResetPasswordToken = require('../models').ResetPasswordToken;

function addAuthority(req, res) {
    let authority = {
        name: req.body.name
    }

    Authority.create(authority).then(result => {
        res.json({
            error: false,
            message: "Authority added successfully!!!"
        });
    }).catch(error => {
        res.json({
            error: true,
            message: "Error in create authority :: " + error
        });
    })
}

function registerUser(req, res) {
    let email = req.body.email;
    let formIsValid = validateRegistration(res, req.body);
    if (formIsValid) {
        User.findAll({
            where: {
                email: email
            }
        }).then(data => {
            if (data.length > 0) {
                res.json({
                    error: true,
                    message: "Email address already exists."
                });
            } else {
                userRegistration(res, req.body);
            }
        }).catch(err => {
            res.json({
                error: true,
                message: "Error in find user from email :: " + err
            });
        });
    }
}

function validateRegistration(res, obj) {
    let isEmpty = checkEmptyFields(obj);
    if (isEmpty) {
        res.json({
            error: true,
            message: "Fill all the fields."
        });
    } else {
        if (!Utils.validateEmail(obj.email)) {
            res.json({
                error: true,
                message: "Not valid email address."
            });
        } else if (obj.password != obj.confirm_password) {
            res.json({
                error: true,
                message: "Password not match."
            });
        } else {
            return true;
        }
    }
}

function checkEmptyFields(obj) {
    let isEmpty = false;
    for (let key in obj) {
        if (obj[key] === '') {
            isEmpty = true;
        }
    }
    return isEmpty;
}

function userRegistration(res, obj) {
    let user = {
        email: obj.email,
        password: Passowrd.hashPassword(obj.password),
        name: obj.name,
        dob: obj.dob,
        gender: obj.gender,
        isEnabled: true,
        isPremium: false,
        isVerified: false
    };

    User.create(user).then(result => {
        if (obj.authority == 'user') {
            userAuthority = [{
                userId: result.id,
                authorityId: 1,
                createdBy: result.id,
                updatedBy: result.id
            }]
        } else {
            userAuthority = [
                {
                    userId: result.id,
                    authorityId: 1,
                    createdBy: result.id,
                    updatedBy: result.id
                },
                {
                    userId: result.id,
                    authorityId: 2,
                    createdBy: result.id,
                    updatedBy: result.id
                }
            ]
        }

        UserAuthority.bulkCreate(userAuthority).then(user_authority_data => {
            console.log('Add user authority successfully.');
        }).catch(error => {
            res.json({
                error: true,
                message: "Error in create user authority :: " + error
            });
        });

        var cryptoToken = CryptoRandomString(16);
        var tokenExpireDate = new Date();
        tokenExpireDate.setDate(new Date().getDate() + 1);
        let verificationToken = {
            token: cryptoToken,
            userId: result.id,
            expireTime: tokenExpireDate,
            isVerified: false,
            createdBy: result.id,
            updatedBy: result.id
        }

        VerificationToken.create(verificationToken).then(verificationTokenData => {
            console.log('Add user varification token successfully.');
        }).catch(error => {
            res.json({
                error: true,
                message: "Error in create user varification token :: " + error
            });
        });

        let data = {
            email: obj.email,
            id: result.id,
            token: cryptoToken,
            name: result.name
        }
        let url = ConfigsApi.url + '/server/users/confirm/';
        MAILER.SEND_ACTIVATION_EMAIL(data, url, (err, info) => {
            if (err) {
                res.json({
                    error: true,
                    code: 212,
                    message: "Can't send activation email please try later :: " + err
                });
            } else {
                res.json({
                    error: false,
                    message: "Registration success Please check you email address.",
                    data: data
                });
            }
        });
    }).catch(error => {
        res.json({
            error: true,
            message: "Error in create user :: " + error
        });
    });
}

function userActivation(req, res) {
    let userToken = req.params.token;

    VerificationToken.findOne({
        where: {
            token: userToken
        }
    }).then(result => {
        let link = ConfigsApi.url;
        if (result.isVerified) {
            res.render("confirmed", { link: link });
        } else {
            User.update({ isVerified: true }, {
                where: {
                    id: result.userId
                }
            }).then(userUpdateResult => {
                console.log('User data updated successfully!!!');
                VerificationToken.update({
                    isVerified: true,
                    expireTime: new Date()
                }, {
                        where: {
                            token: userToken
                        }
                    }).then(info => {
                        res.render("verify", { link: link });
                    }).catch(err => {
                        res.json({
                            error: true,
                            message: err.message
                        });
                    });
            }).catch(err => {
                res.json({
                    error: true,
                    message: err.message
                });
            });
        }
    }).catch(err => {
        res.json({
            error: true,
            message: err.message
        });
    });
}

function login(req, res) {
    let email = req.body.email;
    let password = req.body.password;

    User.findOne({
        where: {
            email: email
        }
    }).then(result => {
        if (result == null) {
            res.json({
                error: true,
                message: "No such user."
            })
        } else {
            let password_db = result.password;
            let isValidPassword = Passowrd.checkPassword(password, password_db);
            if (isValidPassword) {
                if (result.isEnabled) {
                    if (result.isVerified) {
                        let data = {
                            email: result.email,
                            name: result.name,
                            id: result.id
                        };
                        TOKEN.signUserToken(data, USER_JWT.expiresIn).then(result => {
                            res.json({
                                error: false,
                                data: { token: result }
                            });
                        }).catch(err => {
                            res.json({
                                error: true,
                                message: err.message
                            });
                        });
                    } else {
                        res.json({
                            error: true,
                            message: "Please verify your email."
                        });
                    }
                } else {
                    res.json({
                        error: true,
                        message: "Your account is disabled. Plese contact to Admin."
                    });
                }
            } else {
                res.json({
                    error: true,
                    message: "Invalid Credentials."
                });
            }
        }
    }).catch(err => {
        res.send(err);
    });
}

function addNumber(req, res) {
    const client = require('twilio')(Twilio.accountSid, Twilio.authToken);
    var otp = Math.floor(100000 + Math.random() * 900000);

    UserContact.findOne({
        where: {
            contactNumber: req.body.contactNumber
        }
    }).then(userContactData => {
        if (userContactData) {
            if (userContactData.userId == req.user.id) {
                if (userContactData.isVarified) {
                    res.json({
                        error: true,
                        message: "Contact number already varified."
                    });
                } else {
                    res.json({
                        error: true,
                        message: "Please varifi your contact number."
                    });
                }
            } else {
                res.json({
                    error: true,
                    message: "Please use diffrent number, contact number already exist."
                });
            }
        } else {
            let userContact = {
                contactNumber: req.body.contactNumber,
                token: otp,
                userId: req.user.id,
                isVarified: false,
                isActive: true,
                createdBy: req.user.id,
                updatedBy: req.user.id
            };

            UserContact.create(userContact).then(result => {
                client.messages.create({
                    body: 'OTP for varify number is ' + otp + '. This is valid for 30 mins. Please do not share with anyone. marketplace',
                    from: 'your twilio from number',
                    to: req.body.contactNumber
                }).then(message => {
                    res.json({
                        error: false,
                        message: "Contact number added successfully."
                    });
                }).catch(err => {
                    res.json({
                        error: true,
                        message: "Error in sent OTP :: " + err
                    });
                }).done();
            }).catch(error => {
                res.json({
                    error: true,
                    message: "Error in add contact number."
                });
            });
        }
    }).catch(error => {
        res.json({
            error: true,
            message: "Error in find user contact number."
        });
    });
}

function varifyNumber(req, res) {
    UserContact.findOne({
        where: {
            contactNumber: req.body.contactNumber
        }
    }).then(userContact => {
        if (req.body.token == userContact.token) {
            var upDate = new Date(userContact.updatedAt);
            var date = new Date();
            var updatedDate = upDate.setMinutes(upDate.getMinutes() + 30);

            if (updatedDate >= date.getTime()) {
                UserContact.update({
                    isVarified: true
                }, {
                        where: {
                            id: userContact.id
                        }
                    }).then(info => {
                        res.json({
                            error: false,
                            message: "Contact number varified successfully."
                        });
                    }).catch(err => {
                        res.json({
                            error: true,
                            message: "Error in update user contact :: " + err
                        });
                    });
            } else {
                res.json({
                    error: true,
                    message: "Contact varification token is Expired."
                });
            }
        } else {
            res.json({
                error: true,
                message: "Invalid token number."
            });
        }
    }).catch(err => {
        res.json({
            error: true,
            message: "Error in find contact number :: " + err
        });
    });
}

function resendToken(req, res) {
    const client = require('twilio')(Twilio.accountSid, Twilio.authToken);
    var otp = Math.floor(100000 + Math.random() * 900000);

    UserContact.findOne({
        where: {
            contactNumber: req.body.contactNumber
        }
    }).then(userContactData => {
        let userContact = {
            token: otp,
            isVarified: false,
            updatedBy: req.user.id
        };

        UserContact.update(userContact, {
            where: {
                id: userContactData.id
            }
        }).then(updateInfo => {
            client.messages.create({
                body: 'OTP for varify number is ' + otp + '. This is valid for 30 mins. Please do not share with anyone. marketplace',
                from: 'your twilio from number',
                to: req.body.contactNumber
            }).then(message => {
                res.json({
                    error: false,
                    message: "Varification code send successfully."
                });
            }).catch(err => {
                res.json({
                    error: true,
                    message: "Error in sent OTP :: " + err
                });
            }).done();
        });
    }).catch(err => {
        res.json({
            error: true,
            message: "Error in find user contact data :: " + err
        });
    });
}

function resetPassword(req, res) {
    let isValidEmail = checkResetEmail(req, res);

    if (isValidEmail) {
        User.findOne({
            where: {
                email: req.body.email
            }
        }).then(result => {
            if (result != null) {
                var cryptoToken = CryptoRandomString(16);
                var expireDate = new Date();
                expireDate.setHours(expireDate.getHours() + 4);
                let resetPassword = {
                    token: cryptoToken,
                    userId: result.id,
                    expireTime: expireDate,
                    createdBy: result.id,
                    updatedBy: result.id
                }

                ResetPasswordToken.create(resetPassword).then(resetPasswordData => {
                    let data = {
                        id: result.id,
                        email: result.email,
                        name: result.name,
                        token: cryptoToken,
                    };
                    let url = ConfigsApi.url + "/server/users/reset/";
                    MAILER.SEND_RESET_EMAIL(data, url, (err, info) => {
                        if (err) {
                            res.json({
                                error: true,
                                message: "Error in send password reset mail :: " + err
                            });
                        } else {
                            res.json({
                                error: false,
                                message: "Password reset mail send successfully."
                            });
                        }
                    });
                }).catch(err => {
                    res.json({
                        error: true,
                        message: "Error in update user data :: " + err
                    });
                })
            } else {
                res.json({
                    error: true,
                    message: "Email not found."
                });
            }
        }).catch(err => {
            res.json({
                error: true,
                message: "Error in find user data with email :: " + err
            });
        })
    }
}

function checkResetEmail(req, res) {
    let email = req.body.email;
    if (email == "") {
        res.json({
            error: true,
            message: "Email is empty."
        });
        return;
    }

    if (!Utils.validateEmail(email)) {
        res.json({
            error: true,
            message: "Please enter valid email."
        });
        return;
    }
    return true;
}

function reset(req, res) {
    let resetToken = req.params.token;

    ResetPasswordToken.findOne({
        where: {
            token: resetToken
        }
    }).then(result => {
        let date = new Date();
        let expireDate = new Date(result.expireTime);
        let link = ConfigsApi.url;

        if (expireDate < date) {
            res.render("expired_reset", {
                link: link
            });
        } else {
            res.render("reset", {
                id: result.userId,
                link: link
            });
        }
    }).catch(err => {
        res.render("fail_reset", {
            err: err,
            link: link
        })
    });
}

function completeReset(req, res) {
    let new_pass = req.body.new_pass;
    let re_pass = req.body.re_pass;
    let id = req.body.id;
    let date = new Date();

    if (new_pass == re_pass) {
        User.update({ password: Passowrd.hashPassword(new_pass) }, {
            where: {
                id: id
            }
        }).then(result => {
            let resetPasswordToken = {
                expireTime: date,
                updatedBy: id
            }
            ResetPasswordToken.update(resetPasswordToken, {
                where: {
                    userId: id
                }
            }).then(resetPasswordTokenData => {
                res.json({
                    error: false,
                    message: "Password updated successfully."
                });
            }).catch(err => {
                res.json({
                    error: true,
                    message: "Error in update resetPasswordToken data :: " + err
                });
            });
        }).catch(err => {
            res.json({
                error: true,
                message: "Error in update reset password :: " + err
            });
        });
    } else {
        res.json({
            error: true,
            message: "Password are not matched :: " + err
        });
    }
}

function addProfileImage(req, res) {
    let imageData = {
        profile_url: req.body.profile_url
    };

    User.update(imageData, {
        where: {
            id: req.user.id
        }
    }).then(result => {
        res.json({
            error: false,
            result: "User profile image Updated successfully."
        });
    }).catch(err => {
        res.json({
            error: true,
            message: "Error in update user profile image :: " + err
        });
    });
}

function addCompanyUEN(req, res) {
    let companyUENData = {
        company_uen: req.body.company_uen
    };

    User.update(companyUENData, {
        where: {
            id: req.user.id
        }
    }).then(result => {
        res.json({
            error: false,
            result: "Company UEN number updated successfully."
        });
    }).catch(err => {
        res.json({
            error: true,
            message: "Error in update company uen number :: " + err
        });
    });
}

function getUser(req, res) {
    User.findOne({
        where: {
            id: req.user.id
        },
        attributes: ['id', 'email', 'name', 'dob', 'gender', 'company_uen', 'profile_url', 'isPremium'],
        include: [
            {
                model: UserContact,
                as: 'usercontact',
                attributes: ['id', 'contactNumber']
            }
        ]
    }).then(users => {
        res.json({
            error: false,
            message: users
        })
    }).catch(err => {
        res.json({
            error: true,
            message: err.message
        })
    })
}

function updateUser(req, res) {
    let userData = {
        name: req.body.name,
        dob: req.body.dob,
        gender: req.body.gender
    };

    User.update(userData, {
        where: {
            id: req.user.id
        }
    }).then(result => {
        res.json({
            error: false,
            message: "User data updated successfully."
        });
    }).catch(err => {
        res.json({
            error: true,
            message: "Error in update user data."
        });
    });
}

function updateNumber(req, res) {
    UserContact.findOne({
        where: {
            contactNumber: req.body.contactNumber
        }
    }).then(userContactData => {
        if (userContactData) {
            if (userContactData.userId == req.user.id) {
                res.json({
                    error: true,
                    message: "Please use diffrent number, updated number is same as previous number."
                });
            } else {
                res.json({
                    error: true,
                    message: "Please use diffrent number, contact number already exist."
                });
            }
        } else {
            const client = require('twilio')(Twilio.accountSid, Twilio.authToken);
            var otp = Math.floor(100000 + Math.random() * 900000);

            let contactData = {
                contactNumber: req.body.contactNumber,
                token: otp,
                isVarified: false,
                updatedBy: req.user.id
            }

            UserContact.update(contactData, {
                where: {
                    id: req.body.id
                }
            }).then(result => {
                client.messages.create({
                    body: 'OTP for varify number is ' + otp + '. This is valid for 30 mins. Please do not share with anyone. marketplace',
                    from: 'your twilio from number',
                    to: req.body.contactNumber
                }).then(message => {
                    res.json({
                        error: false,
                        message: "Contact number updated successfully."
                    });
                }).catch(err => {
                    res.json({
                        error: true,
                        message: "Error in sent OTP :: " + err
                    });
                }).done();
            }).catch(error => {
                res.json({
                    error: true,
                    message: "Error in update contact number."
                });
            });
        }
    });
}

function updatePassword(req, res) {
    User.findOne({
        where: {
            id: req.user.id
        }
    }).then(result => {
        let isValidPassword = Passowrd.checkPassword(req.body.currentPassword, result.password);
        if (isValidPassword) {
            if (req.body.password == req.body.confirmPassword) {
                let userData = { 
                    password: Passowrd.hashPassword(req.body.password)
                }; 
                User.update(userData, { 
                    where: { 
                        id: req.user.id
                    } 
                }).then(result => { 
                    res.json({ 
                        error: false, 
                        message: "Password updated successfully." 
                    });
                }).catch(err => { 
                    res.json({ 
                        error: true, 
                        message: "Error in update Password :: " + err
                    });
                }); 
            } else { 
                res.json({ 
                    error: true, 
                    message: "Password not matched." 
                });
            }
        } else {
            res.json({
                error: true,
                message: "Plese enter valid current password."
            });
        }
    }).catch(err => {
        res.json({
            error: true,
            message: "Error in find user data :: " + err
        });
    });
}

module.exports.addAuthority = addAuthority;
module.exports.registerUser = registerUser;
module.exports.userActivation = userActivation;
module.exports.login = login;
module.exports.addNumber = addNumber;
module.exports.varifyNumber = varifyNumber;
module.exports.resendToken = resendToken;
module.exports.resetPassword = resetPassword;
module.exports.reset = reset;
module.exports.completeReset = completeReset;
module.exports.addProfileImage = addProfileImage;
module.exports.addCompanyUEN = addCompanyUEN;
module.exports.getUser = getUser;
module.exports.updateUser = updateUser;
module.exports.updateNumber = updateNumber;
module.exports.updatePassword = updatePassword;
