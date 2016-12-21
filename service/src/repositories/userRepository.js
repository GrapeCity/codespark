let mongoose = require('mongoose'),
    _ = require('lodash'),
    CacheableRepository = require('./cacheableRepository');

class UserRepository extends CacheableRepository {
    constructor(server) {
        let model = mongoose.model('User'),
            redisCache = require('./../utils/redisCache')(server);
        super(model, redisCache, 'user:');
        this.userContestsModel = mongoose.model('UserContests');
    }

    /**
     *
     * @param {Number|mongoose.Schema.Types.ObjectId} id
     * @param next
     * @returns {Promise}
     */
    readByIdCore(id, next) {
        this.userContestsModel.find({user: id})
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
                super.readByIdCore(id, next);
            });
    }
}

module.exports = UserRepository;