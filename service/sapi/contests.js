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
            res.status(err.status || 500).json({
                err: true,
                msg: `发生错误：${err.message}`,
                timestamp: new Date().getTime()
            })
        })
});

module.exports = router;