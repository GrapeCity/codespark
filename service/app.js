process.env.NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Load module dependencies
 */
let config = require('./src/config'),
    logger = require('./src/utils/winston').appLogger,
    Server = require('./src/server');

Server.run(server => {
    let logs = `
================================================
Service run successful at ${(new Date()).toLocaleString()}
Http Port   : ${process.env.PORT || 5000}
`;
    if (config.redis && server.resMgr.get('redis')) {
        logs += `Redis       : ${config.redis.host}:${config.redis.port}
`;
    }
    if (config.mongo && server.resMgr.get('mongo')) {
        logs += `Mongo       : ${config.mongo.uri}
`;
    }
    logs += '================================================';
    logger.info(logs);

}, () => {
    logger.info('\n================================================\n' +
        'Service is now stopped\n' +
        '================================================');
});