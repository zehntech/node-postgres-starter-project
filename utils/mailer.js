const nodemailer = require("nodemailer");
const mail_config = require("../config/global_config").CONFIGS.MAILER;
const fs = require('fs');

function SEND_ACTIVATION_EMAIL(data, url, callback) {
    nodemailer.createTestAccount(function (err, account) {
        let transporter = nodemailer.createTransport({
            service: mail_config.service,
            auth: {
                user: mail_config.username,
                pass: mail_config.password
            },
            tls: {
                rejectUnauthorized: mail_config.rejectUnauthorized
            }
        });

        let activation_url = url + data.token;
        let tamplate = fs.readFileSync(mail_config.tamplates.activation);
        tamplate = tamplate.toString('utf8').replace("{{displayName}}", data.name);
        tamplate = tamplate.toString('utf8').replace("{{activation_url}}", activation_url);

        let mailOptions = {
            from: '"' + mail_config.sender_info + '" <' + mail_config.username + '>',
            to: data.email,
            subject: "Welcome to marketplace. Please verify your email id.",
            html: tamplate
        };
        transporter.sendMail(mailOptions, callback);
    });
}

function SEND_RESET_EMAIL(data, url, callback) {
    nodemailer.createTestAccount(function (err, account) {
        let transporter = nodemailer.createTransport({
            service: mail_config.service,
            auth: {
                user: mail_config.username,
                pass: mail_config.password
            },
            tls: {
                rejectUnauthorized: mail_config.rejectUnauthorized
            }
        });

        let reset_url = url + data.token;
        let tamplate = fs.readFileSync(mail_config.tamplates.reset_password);
        tamplate = tamplate.toString('utf8').replace("{{displayName}}", data.name);
        tamplate = tamplate.toString('utf8').replace("{{reset_url}}", reset_url);
        let mailOptions = {
            from: '"' + mail_config.sender_info + '" <' + mail_config.username + '>',
            to: data.email,
            subject: "Reset password",
            html: tamplate
        };
        transporter.sendMail(mailOptions, callback);
    });
}

module.exports.SEND_ACTIVATION_EMAIL = SEND_ACTIVATION_EMAIL;
module.exports.SEND_RESET_EMAIL = SEND_RESET_EMAIL;