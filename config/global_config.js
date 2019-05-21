const CONFIGS = {
    API: {
        url: "http://192.168.0.121:2000"
    },
    MAILER: {
        username: 'your user name',
        password: 'your password',
        rejectUnauthorized: false,
        sender_info: "marketplace",
        service: 'gmail',
        tamplates: {
            activation: "config/tamplates/activation_tamplate.html",
            reset_password: "config/tamplates/reset_password.html",
        }
    },
    JWT_USER: {
        PRIVATE_KEY: __dirname + "/jwt_key/private.key",
        PUBLIC_KEY: __dirname + "/jwt_key/public.key",
        expiresIn: "24h",
        ALGORITHM: "RS256"
    },
    twilio: {
        accountSid: 'your twilio account Id',
        authToken: 'your twilio auth token'
    }
};

module.exports.CONFIGS = CONFIGS;