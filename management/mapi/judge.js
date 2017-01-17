let _            = require('lodash'),
    crypto       = require('crypto'),
    express      = require('express'),
    validator    = require('validator'),
    kue          = require('kue'),
    json         = require('kue/lib/http/routes/json'),
    utils        = require('../utils'),
    mongoose     = utils.mongoose,
    logger       = utils.winston.appLogger,
    redis        = utils.redis,
    router       = express.Router(),
    UserProblems = mongoose.model('UserProblems'),
    UserContests = mongoose.model('UserContests'),
    queue;

router.setup = (config) => {
    queue = kue.createQueue({
        redis: config.redis
    });
};

router.get('/', (req, res) => {
    let {userId, contestId, problemId, solutionId} = req.query;
    solutionId                                     = parseInt(solutionId, 10) || 0;
    logger.info(`fetch solution for user's problem info: u=${userId}, c=${contestId}, p=${problemId}, s=${solutionId}`);
    UserProblems.findOne({user: userId, contest: contestId, problem: problemId})
        .populate('user')
        .populate('contest')
        .populate('problem')
        .exec((err, data) => {
            if (err) {
                logger.error(`Read database error: ${err}`);
                return res.status(500).json({
                    err      : true,
                    msg      : `Fetch user problems error: ${err}`,
                    timestamp: new Date().getTime()
                })
            }
            if (!data || !data.contest || !data.problem) {
                logger.warn(`data error: missing data, contest, or problem`);
                return res.status(404).json({
                    err      : true,
                    msg      : `no such data when user=${userId}, contest=${contestId}, problem=${problemId}`,
                    timestamp: new Date().getTime()
                });
            }
            let solution = _.find(data.solutions, s => s.id === solutionId);
            if (!solution) {
                logger.error(`data error: missing solution`);
                return res.status(404).json({
                    err      : true,
                    msg      : `no such data when user=${userId}, contest=${contestId}, problem=${problemId}, solution=${solutionId}`,
                    timestamp: new Date().getTime()
                });
            }
            res.status(200).json({
                cases  : data.problem.cases,
                source : solution.source,
                runtime: solution.runtime
            });
        });
});

router.post('/', (req, res) => {
    let {userId, contestId, problemId, solutionId} = req.query;
    let {score, results}                           = req.body;
    solutionId                                     = parseInt(solutionId, 10) || 0;
    score                                          = parseInt(score, 10) || 0;
    logger.info(`update solution for user's problem info: u=${userId}, c=${contestId}, p=${problemId}, s=${solutionId || 0}`);
    UserProblems.findOne({user: userId, contest: contestId, problem: problemId})
        .exec((err, data) => {
            if (err) {
                logger.error(`Read database error: ${err}`);
                return res.status(500).json({
                    err      : true,
                    msg      : `Fetch user problems error: ${err}`,
                    timestamp: new Date().getTime()
                })
            }
            let solution = _.find(data.solutions, s => s.id === solutionId);
            if (!solution) {
                logger.error(`data error: missing solution`);
                return res.status(404).json({
                    err      : true,
                    msg      : `no such data when user=${userId}, contest=${contestId}, problem=${problemId}, solution=${solutionId}`,
                    timestamp: new Date().getTime()
                });
            }

            solution.score   = score;
            solution.results = results;
            data.score       = Math.max(score - (Math.min(data.solutions.length * 5, 20)), 0);
            data.save(err => {
                if (err) {
                    logger.error(`save data error: ${err}`);
                    return res.status(500).json({
                        err      : true,
                        msg      : `save data error: ${err}`,
                        timestamp: new Date().getTime()
                    });
                }
                UserProblems.aggregate([{
                    $match: {
                        user   : data.user,
                        contest: data.contest
                    }
                }, {
                    $limit: 1
                }, {
                    $group: {
                        _id  : "$_id",
                        total: {$sum: "$score"},
                        count: {$sum: 1}
                    }
                }]).exec((err, ag) => {
                    UserContests.findOne({user: userId, contest: contestId})
                        .exec((err, uc) => {
                            if (err) {
                                logger.error(`Save UserContest [user=${userId}, contest=${contestId}] error: ${err }`);
                                return;
                            }
                            if (uc) {
                                uc.score = ((((ag || [])[0]) || {}).total || 0);
                                uc.save((err) => {
                                    if (err) {
                                        logger.error(`Save UserContest [user=${userId}, contest=${contestId}] error: ${err }`);
                                        return;
                                    }
                                    let client = redis.client();
                                    client.keys('contest:*', (err, keys) => {
                                        if (keys && keys.length > 0) {
                                            client.del(keys, (err) => {
                                            });
                                        }
                                    });
                                });
                            } else {
                                logger.warn(`the UserContest [user=${userId}, contest=${contestId}] is not found`);
                            }
                        });
                });

                return res.status(201).json({});
            })
        });
});

router.get('/stats', json.stats);
router.get('/job/search', json.search);
router.get('/jobs/:from..:to/:order?', json.jobRange);
router.get('/jobs/:type/:state/:from..:to/:order?', json.jobTypeRange);
router.get('/jobs/:type/:state/stats', json.jobTypeStateStats);
router.get('/jobs/:state/:from..:to/:order?', json.jobStateRange);
router.get('/job/types', json.types);
router.get('/job/:id', json.job);
router.get('/job/:id/log', json.log);
router.get('/inactive/:id', json.inactive);

module.exports = router;