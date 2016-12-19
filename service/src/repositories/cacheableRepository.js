class CacheableRepository {
    /**
     *
     * @param model the model type from mongoose
     * @param redisCache redis cache client wrap
     * @param {string} cacheKeyPrefix prefix for cache item key
     */
    constructor(model, redisCache, cacheKeyPrefix) {
        /**
         * @public
         */
        this.model = model;
        /**
         * @public
         */
        this.redisCache = redisCache;
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
                if(withCache){
                    this.redisCache.updateCache(`${this.cacheKeyPrefix}:${id}`, next => next(null, value))
                        .then(()=> resolve(value))
                        .catch((err)=> reject(err));
                } else {
                    resolve(value);
                }
            })
        });
    }

    /**
     * read the values from the cache if set withCache, or fetch origin
     * @param {Number|mongoose.Schema.Types.ObjectId} id the unique id in database
     * @param withCache
     * @returns {Promise}
     * @public
     */
    readById(id, withCache = false) {
        if (withCache) {
            return this.redisCache.getCache(`${this.cacheKeyPrefix}:${id}`, (next) => {
                this.model.findById(id, next);
            });
        }
        return new Promise((resolve, reject) => {
            this.mode.findById(id, (err, value) => {
                if (err) {
                    return reject(err);
                }
                resolve(value);
            });
        });
    }

    /**
     *
     * @param criteria
     * @returns {*|Query|T|{}}
     * @public
     */
    read(criteria) {
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
    updateById(id, criteria, withCache = false) {
        if (withCache) {
            return this.redisCache.updateCache(`${this.cacheKeyPrefix}:${id}`,
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
    deleteById(id, withCache = false) {
        if (withCache) {
            return this.redisCache.removeCache(`${this.cacheKeyPrefix}:${id}`,
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