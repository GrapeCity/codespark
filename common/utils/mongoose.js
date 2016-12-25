let mongoose = require('mongoose')
logger = require('./winston');

// Use native Promise
mongoose.Promise = global.Promise;

mongoose.setup = (config, resMgr) => {
    mongoose.connect(config.uri,
        config.options,
        err => {
            if (err) {
                logger.warn('Could not connect to MongoDB.');
                logger.warn(err);
            } else {
                if (process.env.NODE_ENV !== 'development') {
                    logger.warn('Connect to MongoDB success.');
                }
                // Enabling mongoose debug mode if required
                mongoose.set('debug', config.debug);

                if (resMgr) {
                    resMgr.add('mongo', mongoose, () => {
                        mongoose.disconnect(err => {
                            if (err) {
                                logger.error(`Error disconnect MongoDB: ${err}`);
                            } else {
                                logger.info('Disconnected from MongoDB successfully');
                            }
                        });
                    });
                }

                if (config.callback) {
                    config.callback(mongoose);
                }
            }
        });
};

module.exports = mongoose;