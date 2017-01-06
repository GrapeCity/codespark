let express = require('express'),
    _ = require('lodash'),
    redisCache = require('../utils/redisCache'),
    validateCode = require('../utils/validateCode'),
    utils = require('../utils'),
    ContestRepository = require('../repositories/contestRepository'),
    ProblemRepository = require('../repositories/problemRepository'),
    logger = utils.winston.appLogger,
    router = express.Router();

router.post('/join', (req, res) => {
    let user = req.user,
        contestId = req.body.contestId,
        contestRepo = new ContestRepository();

    if (!contestId) {
        return res.status(400).json({err: true, msg: '需要参数contestId', timestamp: new Date().getTime()});
    }

    contestRepo.findOneByIdAndUser(contestId, user._id)
        .then(uc => {
            if (uc) {
                return res.status(400).json({
                    err: true,
                    msg: '您已经加入该竞赛了',
                    timestamp: new Date().getTime()
                })
            }

            contestRepo.findById(contestId, '_id')
                .then(c => {
                    if (!c) {
                        return res.status(404).json({
                            err: true,
                            msg: `所指定的竞赛不存在`,
                            timestamp: new Date().getTime()
                        });
                    }

                    contestRepo.createUserContest(user, c)
                        .then(data => {
                            res.status(201)
                                .location(`/workspace/contests/${data._id}`)
                                .json(data);
                        })
                        .catch(err => {
                            res.status(err.status || 500)
                                .json({err: true, msg: err.message, timestamp: new Date().getTime()});
                        })
                })
                .catch(err => {
                    res.status(err.status || 500)
                        .json({err: true, msg: err.message, timestamp: new Date().getTime()});
                });
        })
        .catch(err => {
            res.status(err.status || 500).json({
                err: true,
                msg: `发生错误：${err.message}`,
                timestamp: new Date().getTime()
            })
        });
});

router.get('/contests', (req, res) => {
    let contestRepo = new ContestRepository();
    contestRepo.findByUser(req.user._id)
        .then(data => {
            res.status(200).json(_.map(data, c => c.contest))
        })
        .catch(err => {
            res.status(err.status || 500).json({
                err: true,
                msg: `发生错误：${err.message}`,
                timestamp: new Date().getTime()
            });
        });

});

router.get('/contests/:contestId', (req, res) => {
    let user = req.user,
        contestId = req.params.contestId,
        contestRepo = new ContestRepository();

    contestRepo.findOneByIdAndUser(contestId, user._id)
        .then(uc => {
            if (!uc) {
                return res.status(404).json({
                    err: true,
                    msg: '指定的竞赛不存在或者没有加入该竞赛',
                    timestamp: new Date().getTime()
                });
            }
            res.status(200).json(uc.contest);
        })
        .catch(err => {
            res.status(err.status || 500).json({
                err: true,
                msg: `发生错误：${err.message}`,
                timestamp: new Date().getTime()
            });
        });
});

/**
 * create a  new solution for /:contest/:problem
 */
router.post('/contests/:contestId/problems/:problemId', (req, res) => {
    let userId = req.user._id,
        contestId = req.params.contestId,
        problemId = req.params.problemId,
        {source, runtime} = req.body,
        validation = [],
        problemRepo = new ProblemRepository();

    if (!source) {
        validation.push({msg: '代码不能为空'});
    } else {
        validateCode(source, runtime || 'javascript', validation);
    }
    if (validation.length > 0) {
        return res.status(400).json({
            err: true,
            msg: '代码为空或者包含禁用关键字',
            validation,
            timestamp: new Date().getTime()
        });
    }

    problemRepo.findOneByIdAndUserWithContest(problemId, contestId, userId)
        .then(up => {
            let solutionId = (up && (up.solutions.length + 1) ) || 1,
                solution = {
                    id: solutionId,
                    runtime: runtime || 'javascript',
                    source: source,
                    result: {score: 0},
                    status: 'submitted'
                };
            if (up) {
                up.solutions.push(solution);
                up.save(err => {
                    if (err) {
                        return res.status(err.status || 500).json({
                            err: true,
                            msg: `发生错误：${err.message}`,
                            timestamp: new Date().getTime()
                        });
                    }
                    redisCache.client.publish('solution-ready',
                        JSON.stringify({userId, contestId, problemId, solutionId}));
                    res.status(201).json(solution);
                });
            } else {
                problemRepo.createUserProblem(userId, contestId, problemId,
                    (obj) => obj.solutions.push(solution))
                    .then(data => {
                        redisCache.client.publish('solution-ready',
                            JSON.stringify({userId, contestId, problemId, solutionId}));
                        res.status(201).json(solution);
                    })
                    .catch((err) => {
                        res.status(err.status || 500).json({
                            err: true,
                            msg: `发生错误：${err.message}`,
                            timestamp: new Date().getTime()
                        });
                    });
            }
        })
        .catch(err => {
            res.status(err.status || 500).json({
                err: true,
                msg: `发生错误：${err.message}`,
                timestamp: new Date().getTime()
            });
        });
});

/**
 * get problem info and all its solutions for /:contest/:problem
 */
router.get('/contests/:contestId/problems/:problemId', (req, res) => {
    let userId = req.user._id,
        {contestId, problemId} = req.params,
        problemRepo = new ProblemRepository();
    problemRepo.findOneByIdAndUserWithContest(problemId, contestId, userId)
        .then(up => {
            if (!up) {
                return res.status(404).json({
                    err: true,
                    msg: '指定的竞赛和题目不存在或者没有加入该竞赛，或者没有提交任何解决方案',
                    timestamp: new Date().getTime()
                });
            }
            res.status(200).json(up.solutions);
        })
        .catch(err => {
            res.status(err.status || 500).json({
                err: true,
                msg: `发生错误：${err.message}`,
                timestamp: new Date().getTime()
            });
        })
});

module.exports = router;