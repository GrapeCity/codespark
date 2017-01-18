let _            = require('lodash'),
    fs           = require('fs'),
    path         = require('path'),
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
            let cases = [];
            try {
                cases = fs.readdirSync(path.join(process.cwd(), 'data', problemId))
                    .filter(f => path.extname(f) === '.in')
                    .map(f => parseInt(path.basename(f, '.in'), 10) || 1)
                    .map(id => {
                        let fin  = path.join(process.cwd(), 'data', problemId, `${id}.in`),
                            fout = path.join(process.cwd(), 'data', problemId, `${id}.out`);
                        return {
                            id,
                            input : fs.readFileSync(fin, 'utf8'),
                            expect: fs.readFileSync(fout, 'utf8')
                        };
                    });
            } catch (any) {
                logger.error(`reading folder error: ${any}`);
            }

            res.status(200).json({
                cases  : cases.length > 0 ? cases : data.problem.cases,
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
            data.score       = Math.max(score - (Math.min(Math.max(data.solutions.length - 1, 0) * 5, 25)), 0);
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
                                uc.score    = ((((ag || [])[0]) || {}).total || 0);
                                uc.progress = ((((ag || [])[0]) || {}).count || 0) * 10;
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