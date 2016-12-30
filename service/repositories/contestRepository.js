let _ = require('lodash'),
    redisCache = require('../utils/redisCache'),
    mongoose = require('../utils').mongoose,
    User = mongoose.model('User'),
    Contest = mongoose.model('Contest'),
    UserContests = mongoose.model('UserContests'),
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

    findAllContests() {
        return redisCache.getCache(`${this.cacheKeyPrefix}:all`, next => {
            Contest.find()
                // .populate('problems')
                .exec((err, contests) => {
                    if (err) {
                        return next(err);
                    }
                    return next(null, contests || []);
                });
        });
    }

    findOneByIdWithUser(userId, contestId) {
        return redisCache.getCache(`${this.cacheKeyPrefix}:${userId}:${contestId}`, next => {
            UserContests.findOne({user: userId, contest: contestId})
                .populate('user')
                .populate('contest')
                .exec((err, data) => {
                    if (err) {
                        return next(err);
                    }
                    if(!data) {
                        let e = new Error('Not found');
                        e.code = 404;
                        return next(e);
                    }
                    return next(null, data);
                });
        });
    }
}

module.exports = ContestRepository;