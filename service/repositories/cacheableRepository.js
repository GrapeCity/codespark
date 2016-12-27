let redisCache = require('../utils/redisCache');

class CacheableRepository {
    /**
     *
     * @param model the model type from mongoose
     * @param {string} cacheKeyPrefix prefix for cache item key
     */
    constructor(model, cacheKeyPrefix) {
        /**
         * @public
         */
        this.model = model;
        /**
         * @public
         */
        this.cacheKeyPrefix = cacheKeyPrefix;
    }

    /**
     *
     * @param {function(Object)} set
     * @param withCache
     */
    create(set, withCache = false) {
        return new Promise((resolve, reject) => {
            let instance = new this.model();
            set(instance);
            instance.save((err, value) => {
                if (err) {
                    return reject(err);
                }
                if (withCache) {
                    redisCache.updateCache(`${this.cacheKeyPrefix}:${id}`, next => next(null, value))
                        .then(() => resolve(value))
                        .catch((err) => reject(err));
                } else {
                    resolve(value);
                }
            })
        });
    }

    /**
     * read the values from the cache if set withCache, or fetch origin
     * @param {Number|mongoose.Schema.Types.ObjectId} id the unique id in database
     * @param {string} columns selected columns
     * @param {boolean} withCache use cache or not, default is not used
     * @returns {Promise}
     * @public
     */
    findById(id, columns, withCache = false) {
        if (withCache) {
            return redisCache.getCache(`${this.cacheKeyPrefix}:${id}`, (next) => {
                this.findByIdCore(id, columns, next);
            });
        }
        return new Promise((resolve, reject) => {
            this.findByIdCore(id, columns, (err, value) => {
                if (err) {
                    return reject(err);
                }
                resolve(value);
            });
        });
    }

    findByIdCore(id, columns, next) {
        this.model.findById(id, columns, next);
    }

    /**
     *
     * @param criteria
     * @returns {*|Query|T|{}}
     * @public
     */
    find(criteria) {
        return this.mode.find(criteria);
    }

    /**
     *
     * @param id
     * @param criteria
     * @param withCache
     * @returns {Promise}
     * @public
     */
    findByIdAndUpdate(id, criteria, withCache = false) {
        if (withCache) {
            return redisCache.updateCache(`${this.cacheKeyPrefix}:${id}`,
                next => this.model.findById(id).update(criteria, next));
        }
        return new Promise((resolve, reject) => {
            this.model.findById(id)
                .update(criteria, (err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(data);
                });
        });
    }

    /**
     *
     * @param id
     * @param withCache
     * @returns {Promise}
     * @public
     */
    findByIdAndDelete(id, withCache = false) {
        if (withCache) {
            return redisCache.removeCache(`${this.cacheKeyPrefix}:${id}`,
                next => this.model.findById(id).remove(next));
        }
        return new Promise((resolve, reject) => {
            this.model.findById(id)
                .remove((err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(data);
                });
        });
    }
}

module.exports = CacheableRepository;