let CacheableRepository = require('./cacheableRepository');

class UserRepository extends CacheableRepository {
    constructor(model, redisCache) {
        super(model, redisCache, 'user:');
    }

    /**
     *
     * @param {string} mail
     * @returns {Promise}
     */
    readByMail(mail) {
        return new Promise((resolve, reject) => {
            this.mode.findById({mail: mail}, (err, value) => {
                if (err) {
                    return reject(err);
                }
                resolve(value);
            });
        });
    }
}

module.exports = UserRepository;