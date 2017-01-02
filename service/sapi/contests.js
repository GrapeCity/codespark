let express = require('express'),
    utils = require('../utils'),
    ContestRepository = require('../repositories/contestRepository'),
    logger = utils.winston.appLogger,
    router = express.Router();

router.get('/active', (req, res) => {
    let contentRepo = new ContestRepository(),
        user = req.user;
    contentRepo.findActiveContest(!user || user.mail.slice(-14) !== '@grapecity.com')
        .then(contests => {
            res.status(200).json(contests);
        })
        .catch(err => {
            logger.error(`Error while query database: ${err}`);
            res.status(500).json({
                err: true,
                msg: '读取竞赛元数据出错！',
                timestamp: new Date()
            });
        })
});

router.get('/', (req, res) => {
    let contentRepo = new ContestRepository(),
        user = req.user;
    contentRepo.findAllContests(!user || user.mail.slice(-14) !== '@grapecity.com')
        .then(contests => {
            res.status(200).json(contests);
        })
        .catch(err => {
            logger.error(`Error while query database: ${err}`);
            res.status(500).json({
                err: true,
                msg: '读取竞赛元数据出错！',
                timestamp: new Date()
            });
        });
});

router.get('/:contestId', (req, res) => {
    let contestId = req.params.contestId,
        contentRepo = new ContestRepository();
    contentRepo.findById(contestId, '', true)
        .then(data => {
            res.status(200).json(data);
        })
        .catch(err => {
            res.status(err.code || 500).json({
                err: true,
                msg: `发生错误：${err.message}`,
                timestamp: new Date().getTime()
            })
        })
});

router.post('/:contestId/join', (req, res) => {
    let user = req.user,
        contestId = req.params.contestId,
        contestRepo = new ContestRepository();

    contestRepo.findOneByIdAndUser(user._id, contestId)
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
                            res.status(err.code || 500)
                                .json({err: true, msg: err.message, timestamp: new Date().getTime()});
                        })
                })
                .catch(err => {
                    res.status(err.code || 500)
                        .json({err: true, msg: err.message, timestamp: new Date().getTime()});
                });
        })
        .catch(err => {
            res.status(err.code || 500).json({
                err: true,
                msg: `发生错误：${err.message}`,
                timestamp: new Date().getTime()
            })
        });
});

module.exports = router;