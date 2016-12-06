var redis = require('redis'),
    config = require('../config'),
    logger = require('./winston').appLogger;

module.exports = function (server) {
    var client;
    if(server.resMgr && (client = server.resMgr.get('redis'))){
        return client;
    }
    var redisOpts = {
        host: config.redis.host,
        port: config.redis.port,
        retry_strategy: function (options) {
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
    if(config.redis.password){
        redisOpts.password = config.redis.password;
    }
    client = redis.createClient(redisOpts);
    client.on('error', function(err){
        logger.error('Redis Error: ' + err);
    });
    server.resMgr.add('redis', client, function(){
        client.quit();
    })
};