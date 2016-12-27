module.exports = {
    setup(redisClient, expiry = 60 * 60) {
        this.client = redisClient;
        this.expiry = expiry;
    },

    /**
     * Get the item from cache if hit, otherwise use callback to retrieve origin
     * @param {String} key the unique cached item key
     * @param {function(function(Error, Object))} callback retrieve original value
     * @return {Promise}
     */
    getCache(key, callback) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, replies) => {
                if (err) {
                    reject(err);
                }
                if (!replies) {
                    callback((err, value) => {
                        if (err) {
                            reject(err);
                        }
                        if (!value) {
                            return this.client.del(key, (err) => {
                                reject(err || (err = new Error('Not found'), err.code = 404 ) && err);
                            });
                        }
                        this.client.setex(key, this.expiry, JSON.stringify(value), (err) => {
                            if (err) {
                                reject(err);
                            }
                            resolve(value);
                        });
                    });
                } else {
                    try {
                        resolve(JSON.parse(replies));
                    } catch (any) {
                        reject(any);
                    }
                }
            })
        });
    },

    /**
     * Update the item to cache storage with the origin returned from callback
     * @param {String} key the unique cached item key
     * @param {function(function(Error, Object))} callback retrieve original value
     * @returns {Promise}
     */
    updateCache(key, callback) {
        return new Promise((resolve, reject) => {
            callback((err, value) => {
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
        });
    },

    /**
     * Remove the item from cache
     * @param {String} key the unique cached item key
     * @param {function(function(Error, Object))} callback to remove original value
     * @returns {Promise}
     */
    removeCache(key, callback) {
        return new Promise((resolve, reject) => {
            callback((err, value) => {
                if (err) {
                    reject(err);
                }
                this.client.del(key, (err, count) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(count);
                });
            });
        });
    }
};
