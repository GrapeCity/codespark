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
}

module.exports = ProblemRepository;