process.env.NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Load module dependencies
 */
var config = require('./src/config'),
    logger = require('./src/utils/winston').appLogger,
    Server = require('./src/server');

Server.run(function (server) {
    var logs = '\n================================================\n' +
        'Service run successful at ' + (new Date()).toLocaleString() + '\n' +
        'Http Port   : ' + (process.env.PORT || 5000) + '\n';
    if (config.redis && server.resMgr.get('redis')) {
        logs += 'Redis       : ' + config.redis.host + ':' + config.redis.port + '\n';
    }
    if (config.mongo && server.resMgr.get('mongo')) {
        logs += 'Mongo       : ' + config.mongo.uri + '\n';
    }
    logs += '================================================';
    logger.info(logs);

}, function () {
    logger.info('\n================================================\n' +
        'Service is now stopped\n' +
        '================================================');
});