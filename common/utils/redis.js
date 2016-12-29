let redis = require('redis'),
    logger = require('./winston').appLogger;

module.exports = {
    redis,
    setup: (config, resMgr) => {
        let redisOpts = {
            host: config.host,
            port: config.port,
            retry_strategy: options => {
                if (options.error && options.error.code === 'ECONNREFUSED') {
                    // End reconnecting on a specific error and flush all commands with a individual error
                    return new Error('The server refused the connection');
                }
                if (options.total_retry_time > 1000 * 60 * 60) {
                    // End reconnecting after a specific timeout and flush all commands with a individual error
                    return new Error('Retry time exhausted');
                }
                if (options.times_connected > 10) {
                    // End reconnecting with built in error
                    return undefined;
                }
                // reconnect after
                return Math.min(options.attempt * 100, 3000);
            }
        };
        if (config.password) {
            redisOpts.password = config.password;
        }
        this.redisClient = redis.createClient(redisOpts);
        this.redisClient.on('error', err => logger.error(`Redis Error: ${err}`));
        if (resMgr) {
            resMgr.add('redis', this.redisClient, () => {
                this.redisClient.quit();
                this.redisClient = null;
                logger.info('Disconnected from Redis successfully');
            });
        }
    },
    client: () => this.redisClient
};