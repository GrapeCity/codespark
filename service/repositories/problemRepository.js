let _ = require('lodash'),
    redisCache = require('../utils/redisCache'),
    mongoose = require('../utils').mongoose,
    User = mongoose.model('User'),
    Problem = mongoose.model('Problem'),
    UserProblems = mongoose.model('UserProblems'),
    CacheableRepository = require('./cacheableRepository');

class ProblemRepository extends CacheableRepository {
    constructor() {
        super(Problem, 'problem');
    }

    createUserProblem(user, contest, problem, set = null) {
        return new Promise((resolve, reject) => {
            let obj = new UserProblems({
                user: user,
                contest: contest,
                problem: problem,
                solutions: []
            });
            if (set) {
                set(obj);
            }
            obj.save(err => {
                if (err) {
                    return reject(err);
                }
                resolve(obj);
            });
        });
    }

    findOneByIdAndUserWithContest(problemId, contestId, userId) {
        return new Promise(
            (resolve, reject) => UserProblems.findOne({user: userId, contest: contestId, problem: problemId})
            // .populate('user')
                .populate('contest')
                .populate('problem', '-cases')
                .exec((err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(data);
                }));
    }
}

module.exports = ProblemRepository;