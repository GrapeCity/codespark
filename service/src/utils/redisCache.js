let redis = require('./redis'),
    logger = require('./winston').appLogger;

class RedisCache {
    constructor(client, expiry = 60 * 60) {
        this.client = client;
        this.expiry = expiry;
    }

    /**
     *
     * @param key
     * @param fallback
     * @return {Promise}
     */
    getCache(key, fallback) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, replies) => {
                if (err) {
                    reject(err);
                }
                if (!replies) {
                    fallback(null, (err, value) => {
                        if (err) {
                            reject(err);
                        }
                        this.client.setex(key, this.expiry, value, (err) => {
                            if (err) {
                                reject(err);
                            }
                            resolve(JSON.parse(value));
                        })
                    });
                } else {
                    resolve(JSON.parse(replies));
                }
            })
        });
    }
}

module.exports = function (server) {
    return new RedisCache(redis(server));
};
