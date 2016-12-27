let express = require('express'),
    utils = require('../utils'),
    ContestRepository = require('../repositories/contestRepository'),
    logger = utils.winston.appLogger,
    router = express.Router();

router.getActive = (req, res) => {
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

router.getAll = (req, res) => {
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
});

router.post('/:contest/join', (req, res) => {

});

module.exports = router;