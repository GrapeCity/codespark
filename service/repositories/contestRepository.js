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

    findOneByIdAndUser(userId, contestId) {
        return new Promise(
            (resolve, reject) => UserContests.findOne({user: userId, contest: contestId})
            // .populate('user')
            // .populate('contest')
                .exec((err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(data);
                }));
    }
}

module.exports = ContestRepository;