let CacheableRepository = require('./cacheableRepository'),
    _ = require('lodash');

class UserRepository extends CacheableRepository {
    constructor(model, redisCache) {
        super(model, redisCache, 'user:');
        this.userModel = model;
    }

    withContest(userContestsModel) {
        this.userContestsModel = userContestsModel;
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
                if(err){
                    return next(err);
                }
                if(data){
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