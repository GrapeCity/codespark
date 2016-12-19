let mongoose = require('mongoose'),
    config = require('../config'),
    logger = require('./winston').appLogger;

require('../models');

// Use native Promise
mongoose.Promise = global.Promise;

// mongoose
module.exports = (server, callback) => {
    mongoose.connect(config.mongo.uri,
        config.mongo.options,
        err => {
            if (err) {
                logger.warn('Could not connect to MongoDB.');
                logger.warn(err);
            } else {
                if (process.env.NODE_ENV !== 'development') {
                    logger.warn('Connect to MongoDB success.');
                }
                // Enabling mongoose debug mode if required
                mongoose.set('debug', config.mongo.debug);

                server.resMgr.add('mongo', mongoose, () => {
                    mongoose.disconnect(err => {
                        if (err) {
                            logger.error(`Error disconnect MongoDB: ${err}`);
                        } else {
                            logger.info('Disconnected from MongoDB successfully');
                        }
                    });
                });

                if (callback) {
                    callback();
                }
            }
        });
};