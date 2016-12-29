let redis = require('redis'),
    logger = require('../../common/utils/winston').appLogger;

module.exports = (config, resMgr) => {
    let client = redis.createClient(config);
    resMgr.add('subscriber', client, () => {
        client.unsubscribe();
        client.quit();
        logger.info('Disconnected from Redis successfully');
    });
    client.on("subscribe", function (channel, count) {
        logger.info('ready to receive message')
    });
    client.on("message", function (channel, message) {
        console.log("sub channel " + channel + ": " + message);
        let data = JSON.parse(message);

    });
    client.subscribe('solution');
};