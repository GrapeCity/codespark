let express = require('express'),
    utils = require('../utils'),
    ContestRepository = require('../repositories/contestRepository'),
    logger = utils.winston.appLogger,
    router = express.Router();

router.getActiveContests = (req, res) => {
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
};

router.getAllContests = (req, res) => {
    let contentRepo = new ContestRepository();
    contentRepo.findAllContests(true)
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
};

router.get('/:contest', (req, res) => {
    let uid = req.user._id,
        contest = req.params.contest,
        contentRepo = new ContestRepository();
    contentRepo.findOneByIdWithUser(contest, uid)
        .then(data => {
            res.status(200).json(data.contest);
        })
        .catch(err => {
            res.status(err.code || 500).json({
                err: true,
                msg: `发生错误：${err.message}`,
                timestamp: new Date().getTime()
            })
        })
});

router.post('/:contest/join', (req, res) => {

});

module.exports = router;