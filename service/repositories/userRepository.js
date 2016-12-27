let _ = require('lodash'),
    redisCache = require('../utils/redisCache'),
    mongoose = require('../utils').mongoose,
    User = mongoose.model('User'),
    UserContests = mongoose.model('UserContests'),
    CacheableRepository = require('./cacheableRepository');

class UserRepository extends CacheableRepository {
    constructor() {
        super(User, 'user');
    }

    /**
     *
     * @param {Number|mongoose.Schema.Types.ObjectId} id
     * @returns {Promise}
     */
    findByIdAndPopulate(id) {
        return redisCache.getCache(`${this.cacheKeyPrefix}:${id}-populated`, (next) => {
            UserContests.find({user: id})
                .populate('user')
                .populate('contest')
                .populate('contest.problems')
                .exec((err, data) => {
                    if (err) {
                        return next(err);
                    }
                    if (data && data.length > 0) {
                        console.log(JSON.stringify(data));
                        let user = _.assign({}, data[0].user);
                        user.contests = _.map(data, (it) => {
                            let contest = _.assign({}, it.contest);
                            contest.score = it.score;
                        });
                        return next(null, user);
                    }
                    this.findByIdCore(id, null, next);
                });
        });
    }

    findOneByMail(mail, withCache = false) {
        if (withCache) {
            return redisCache.getCache(`${this.cacheKeyPrefix}:${mail}`, (next) => {
                User.findOne({mail}, next);
            });
        }
        return new Promise((resolve, reject) => {
            User.findOne({mail}, (err, user) => {
                if (err) {
                    return reject(err);
                }
                resolve(user);
            });
        });
    }
}

module.exports = UserRepository;