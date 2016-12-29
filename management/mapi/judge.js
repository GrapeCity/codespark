let _ = require('lodash'),
    crypto = require('crypto'),
    express = require('express'),
    validator = require('validator'),
    kue = require('kue'),
    json = require('kue/lib/http/routes/json'),
    utils = require('../utils'),
    mongoose = utils.mongoose,
    logger = utils.winston.appLogger,
    router = express.Router(),
    UserProblems = mongoose.model('UserProblems'),
    queue;

router.setup = (config) => {
    queue = kue.createQueue({
        redis: config.redis
    });
};

router.get('/', (req, res) => {
    let {userId, contestId, problemId, solutionId} = req.query;
    UserProblems.findOne({user: userId, contest: contestId, problem: problemId})
        .populate('user')
        .populate('contest')
        .populate('problem')
        .exec((err, data) => {
            if(err){
                return res.status(500).json({
                    err: true,
                    msg: `Fetch user problems error: ${err}`,
                    timestamp: new Date().getTime()
                })
            }
            if(!data || !data.contest || !data.problem) {
                return res.status(404).json({
                    err: true,
                    msg: `no such data when user=${userId}, contest=${contestId}, problem=${problemId}`,
                    timestamp: new Date().getTime()
                });
            }
            let sid = parseInt(solutionId, 10);
            let solution = _.find(data.solutions, s => s.id === sid);
            if(!solution){
                return res.status(404).json({
                    err: true,
                    msg: `no such data when user=${userId}, contest=${contestId}, problem=${problemId}, solution=${solutionId}`,
                    timestamp: new Date().getTime()
                });
            }
            res.status(200).json({
                cases: data.problem.cases,
                source: solution.source,
                runtime: solution.runtime
            });
        });
});

router.post('/', (req, res) => {

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