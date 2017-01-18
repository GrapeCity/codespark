let _                   = require('lodash'),
    moment              = require('moment'),
    redisCache          = require('../utils/redisCache'),
    mongoose            = require('../utils').mongoose,
    User                = mongoose.model('User'),
    Contest             = mongoose.model('Contest'),
    UserContests        = mongoose.model('UserContests'),
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
                user   : user._id,
                contest: contest._id,
                score  : 0,
                begin  : moment(contest.begin, 'LLL').toDate(),
                end    : moment(contest.end, 'LLL').toDate()
            });
            obj.save(err => {
                if (err) {
                    return reject(err);
                }
                let real     = obj.toObject();
                real.user    = user;
                real.contest = contest;
                resolve(real);
            });
        });
    }

    findByIdCore(id, columns, next) {
        this.model.findById(id, columns)
            .populate('problems', '-cases')
            .exec(next);
    }

    findActiveContests(openOnly = true, sort = '') {
        // return redisCache.getCache(`${this.cacheKeyPrefix}:ActiveContests`, next => {
        //     Contest.find(openOnly ? {open: true} : null)
        //         .gte('end', new Date())
        //         .lte('begin', new Date())
        //         .sort(sort)
        //         .exec((err, contests) => {
        //             if (err) {
        //                 return next(err);
        //             }
        //             return next(null, contests || []);
        //         });
        // });
        return new Promise((resolve, reject) => {
            Contest.find(openOnly ? {open: true} : null)
                .gte('end', new Date())
                .lte('begin', new Date())
                .sort(sort)
                .exec((err, contests) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(contests || []);
                });
        });
    }

    getLatestActiveInfo() {
        //return redisCache.getCache(`${this.cacheKeyPrefix}:latestActive`, this._findLatestActiveInfo);
        return new Promise((resolve, reject) => {
            this._findLatestActiveInfo((err, value) => {
                if (err) {
                    return reject(err);
                }
                resolve(value);
            });
        });
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
                if (!contest) {
                    err        = new Error('Not found');
                    err.status = 404;
                    return next(err);
                }

                UserContests.find({contest: contest._id})
                    .count()
                    .exec((err, userCount) => {
                        if (err) {
                            return next(err);
                        }
                        let obj       = contest.toObject();
                        obj.userCount = userCount;
                        if (userCount > 0) {
                            UserContests.findOne({contest: contest._id})
                                .sort('-score')
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

    findByName(contestName) {
        // return redisCache.getCache(`${this.cacheKeyPrefix}:${contestName}`, next => {
        //     Contest.findOne({name: contestName})
        //         .populate('problems', '-cases')
        //         .exec((err, contest) => {
        //             if (err) {
        //                 return next(err);
        //             }
        //             if (!contest) {
        //                 err        = new Error('Not found');
        //                 err.status = 404;
        //                 return next(err);
        //             }
        //             let obj   = contest.toObject();
        //             obj.begin = moment(obj.begin).format('LLL');
        //             obj.end   = moment(obj.end).format('LLL');
        //             next(null, obj);
        //         });
        // })
        return new Promise((resolve, reject) => {
            Contest.findOne({name: contestName})
                .populate('problems', '-cases')
                .exec((err, contest) => {
                    if (err) {
                        return reject(err);
                    }
                    if (!contest) {
                        err        = new Error('Not found');
                        err.status = 404;
                        return reject(err);
                    }
                    let obj   = contest.toObject();
                    obj.begin = moment(obj.begin).format('LLL');
                    obj.end   = moment(obj.end).format('LLL');
                    resolve(obj);
                });
        });

    }

    findOneByIdAndUser(contestId, userId) {
        // return redisCache.getCache(`${this.cacheKeyPrefix}:${contestId}:${userId}`, next => {
        //     UserContests.findOne({contest: contestId, user: userId})
        //         .exec((err, uc) => {
        //             if (err) {
        //                 return next(err);
        //             }
        //             if (!uc) {
        //                 err        = new Error('Not found');
        //                 err.status = 404;
        //                 return next(err);
        //             }
        //             let obj   = uc.toObject();
        //             obj.begin = moment(obj.begin).format('LLL');
        //             obj.end   = moment(obj.end).format('LLL');
        //             next(null, obj);
        //         });
        // })
        return new Promise((resolve, reject) => {
            UserContests.findOne({contest: contestId, user: userId})
                .exec((err, uc) => {
                    if (err) {
                        return reject(err);
                    }
                    if (!uc) {
                        err        = new Error('Not found');
                        err.status = 404;
                        return reject(err);
                    }
                    let obj   = uc.toObject();
                    obj.begin = moment(obj.begin).format('LLL');
                    obj.end   = moment(obj.end).format('LLL');
                    resolve(obj);
                });
        })
    }

    getTop10(contestId) {
        // return redisCache.getCache(`${this.cacheKeyPrefix}:${contestId}:top10`,
        //     next => this._findTop10ById(contestId, next));
        return new Promise((resolve, reject) => {
            this._findTop10ById(contestId, (err, value) => {
                if (err) {
                    return reject(err);
                }
                resolve(value);
            });
        });
    }

    updateTop10(contestId) {
        return redisCache.updateCache(`${this.cacheKeyPrefix}:${contestId}:top10`,
            next => this._findTop10ById(contestId, next));
    }

    _findTop10ById(contestId, next) {
        UserContests.find({contest: contestId, score: {$gt: 0}})
            .sort('-score')
            .populate('user')
            .exec((err, uc) => {
                if (err) {
                    return next(err);
                }
                if (!uc) {
                    err        = new Error('Not found');
                    err.status = 404;
                    return next();
                }
                next(null, uc);
            });
    }
}

module.exports = ContestRepository;