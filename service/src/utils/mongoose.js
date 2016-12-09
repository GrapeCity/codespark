var mongoose = require('mongoose'),
    config = require('../config'),
    logger = require('./winston').appLogger;

require('../models');

// mongoose
module.exports = function (server, callback) {
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

            server.resMgr.add('mongo', mongoose, function () {
                mongoose.disconnect(function (err) {
                    if (err) {
                        logger.error('Error disconnect MongoDB: ' + err);
                    } else {
                        logger.info('Disconnected from MongoDB successfully');
                    }
                });
            });

            if(callback){
                callback();
            }
        }
    });
};