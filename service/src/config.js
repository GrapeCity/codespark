/**
 * Load module dependencies
 */
var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    logger = require('./utils/winston').appLogger;

var builtinConfigs = {
    mongo: {
        uri: `${process.env.MONGO_PORT_27017_TCP_ADDR || '127.0.0.1'}:${process.env.MONGO_PORT_27017_TCP_PORT || '27017'}/codespark`,
        options: {
            auth: {
                authSource: process.env.MONGODB_AUTH_SOURCE || 'admin'
            }
        },
        debug: false
    },
    security: {
        username: 'account',
        password: '9GgF3XFfKYmaFNwX8fBEejejJpfD2JvkavS'
    },
    redis: {
        host: process.env.REDIS_PORT_6379_TCP_ADDR || '127.0.0.1',
        port: process.env.REDIS_PORT_6379_TCP_PORT || 6379
    },
    session: {
        maxAge: 24 * (60 * 60 * 1000),
        key: 'sessionId',
        secret: 'session-secret-DSVyhDLOQUE3UGSsDRhuvDjVEO62VbFAsQeKsxLMK61GqoRTNt9b5OOFWgM5QNSE',
        secure: false,
        httpOnly: true,
        sessionCollection: 'sessions'
    }
};

module.exports = (() => {
    let config = {};

    function loadConfigAsync(fullPath, callback) {
        fs.readFile(fullPath, 'utf8', (err, data) => {
            if (err) {
                callback(err, null);
            }
            callback(null, JSON.parse(data));
        });
    }

    function loadConfigSync(file, fallback) {
        let data = {};
        try {
            data = JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8'));
        } catch (any) {
            logger.warn(`${file} is not existed, will use default`);
        }
        return _.extend(fallback, data);
    }

    // load database config
    config.adAuth = loadConfigSync('conf/adAuth.json', builtinConfigs.adAuth);

    config.mongo = loadConfigSync('conf/mongo.json', builtinConfigs.mongo);

    config.security = loadConfigSync('conf/security.json', builtinConfigs.security);

    config.redis = loadConfigSync('conf/redis.json', builtinConfigs.redis);

    config.session = loadConfigSync('conf/session.json', builtinConfigs.session);

    // add watch for conf folder
    config._watch = fs.watch(path.join(process.cwd(), 'conf'), (evt, fn) => {
        if (fn && fn.substr(fn.length - 5, 5) === '.json') {
            let confPart = fn.substr(0, fn.length - 5);
            loadConfigAsync('conf/' + fn, (err, data) => {
                if (!err && data) {
                    logger.info('reload config for [' + confPart + ']');
                    config[confPart] = _.extend(builtinConfigs[confPart], data);
                }
            })
        }
    });

    return config;
})();