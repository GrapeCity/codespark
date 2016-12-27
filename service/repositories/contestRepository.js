let _ = require('lodash'),
    redisCache = require('../utils/redisCache'),
    mongoose = require('../utils').mongoose,
    User = mongoose.model('User'),
    Contest = mongoose.model('Contest'),
    CacheableRepository = require('./cacheableRepository');

class ContestRepository extends CacheableRepository {
    constructor() {
        super(Contest, 'contest');
    }

    findActiveContest(openOnly = true) {
        return new Promise((resolve, reject) => {
            Contest.find(openOnly ? {open: true} : null)
                .gte('end', new Date())
                .lte('begin', new Date())
                .exec((err, contests) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(contests || []);
                });
        });
    }

    findAllContests(withCache = false) {
        return redisCache.getCache(`${this.cacheKeyPrefix}:all`, next => {
            Contest.find()
                .populate('problems')
                .exec((err, contests) => {
                    if (err) {
                        return next(err);
                    }
                    return next(null, contests || []);
                });
        });
    }
}

module.exports = ContestRepository;