
var mongoose = require('mongoose'),
    config   = require('../config'),
    logger   = require('./winston').appLogger;

/**
 * Connect to mongodb.
 *
 * @param callback
 */
module.exports.connect = function (callback) {
    mongoose.connect(config.mongo.uri, config.mongo.options, function (err) {
        if (err) {
            logger.warn('Could not connect to MongoDB.');
            logger.warn(err);
        } else {
            if (process.env.NODE_ENV !== 'development') {
                logger.warn('Connect to MongoDB success.');
            }
            // Enabling mongoose debug mode if required
            mongoose.set('debug', config.mongo.debug);
            if (callback) {
                callback(mongo);
            }
        }
    });
};

/**
 * Disconnect from the mongodb.
 *
 * @param callback
 */
module.exports.disconnect = function (callback) {
    mongoose.disconnect(function (err) {
        if (callback) {
            callback(err);
        }
    });
};