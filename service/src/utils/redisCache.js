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
    getOrUpdate(key, fallback) {
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
                        this.client.setex(key, this.expiry, JSON.stringify(value), (err) => {
                            if (err) {
                                reject(err);
                            }
                            resolve(value);
                        });
                    });
                } else {
                    resolve(JSON.parse(replies));
                }
            })
        });
    }

    remove(key) {
        return new Promise((resolve, reject) => {
            this.client.del(key, (err, count) => {
                if (err) {
                    reject(err);
                }
                resolve(count);
            });
        });
    }
}

module.exports = function (server) {
    return new RedisCache(redis(server));
};
