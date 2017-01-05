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

    create(set, withCache = false) {
        return new Promise((resolve, reject) => {
            super.create(set, withCache)
                .then(data => {
                    redisCache.updateCache(`${this.cacheKeyPrefix}:latestActive`, next => {
                        next(null, data);
                    });
                    resolve(data);
                })
                .catch(err => {
                    reject(err);
                })
        });
    }

    createUserContest(user, contest) {
        return new Promise((resolve, reject) => {
            let obj = new UserContests({
                user: user._id,
                contest: contest._id,
                score: 0,
                begin: contest.begin,
                end: contest.end
            });
            obj.save(err => {
                if (err) {
                    return reject(err);
                }
                let real = obj.toObject();
                real.user = user;
                real.contest = contest.toObject();
                resolve(real);
            });
        });
    }

    findByIdCore(id, columns, next) {
        this.model.findById(id, columns)
            .populate('problems', '-cases')
            .exec(next);
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

    getLatestActiveInfo() {
        return redisCache.getCache(`${this.cacheKeyPrefix}:latestActive`, this._findLatestActiveInfo);
    }

    updateLatestActiveInfo() {
        return redisCache.updateCache(`${this.cacheKeyPrefix}:latestActive`, this._findLatestActiveInfo);
    }

    _findLatestActiveInfo(next) {
        Contest.findOne()
            .gte('end', new Date())
            .lte('begin', new Date())
            .sort('-begin')
            .exec((err, contest) => {
                if (err) {
                    return next(err);
                }
                UserContests.find({contest: contest._id})
                    .count()
                    .exec((err, userCount) => {
                        if (err) {
                            return next(err);
                        }
                        let obj = contest.toObject();
                        obj.userCount = userCount;
                        if (userCount > 0) {
                            UserContests.findOne({contest: contest._id})
                                .sort('score')
                                .select('score')
                                .limit(1)
                                .exec((err, uc) => {
                                    if (err) {
                                        return next(err);
                                    }
                                    obj.maxScore = uc.score;
                                    return next(null, obj);
                                });
                        } else {
                            obj.maxScore = 0;
                            return next(null, obj);
                        }
                    });
            });
    }

    findAllContests(openOnly = true) {
        return redisCache.getCache(`${this.cacheKeyPrefix}:all`, next => {
            Contest.find(openOnly ? {open: true} : null)
            // .populate('problems')
                .exec((err, contests) => {
                    if (err) {
                        return next(err);
                    }
                    return next(null, contests || []);
                });
        });
    }

    findByUser(userId) {
        return new Promise(
            (resolve, reject) => UserContests.find({user: userId})
                .exec((err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(data);
                }));
    }

    findOneByIdAndUser(contestId, userId) {
        return new Promise(
            (resolve, reject) => UserContests.findOne({user: userId, contest: contestId})
            // .populate('user')
                .populate('contest')
                .exec((err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(data);
                }));
    }
}

module.exports = ContestRepository;