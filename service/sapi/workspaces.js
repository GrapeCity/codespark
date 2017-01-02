let express = require('express'),
    _ = require('lodash'),
    utils = require('../utils'),
    ContestRepository = require('../repositories/contestRepository'),
    logger = utils.winston.appLogger,
    router = express.Router();

router.get('/contests', (req, res) => {
    let contestRepo = new ContestRepository();
    contestRepo.findByUser(req.user._id)
        .then(data => {
            res.status(200).json(_.map(data, c => c.contest))
        })
        .catch(err => {
            res.status(err.code || 500).json({
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

    contestRepo.findOneByIdAndUser(user._id, contestId)
        .then(uc => {
            res.status(200).json(uc.contest);
        })
        .catch(err => {
            res.status(err.code || 500).json({
                err: true,
                msg: `发生错误：${err.message}`,
                timestamp: new Date().getTime()
            });
        });
});

// router.post('/contests/:contestId/join', (req, res) => {
//     res.status(200).json({
//         msg: 'join special contest'
//     })
// });

router.get('/contests/:contestId/problems', (req, res) => {
    res.status(200).json({
        msg: 'get problems in joined special contest'
    })
});

router.get('/contests/:contestId/problems/:problemId', (req, res) => {
    res.status(200).json({
        msg: 'get special problem in joined special contest'
    })
});

router.post('/contests/:contestId/problems/:problemId', (req, res) => {
    res.status(200).json({
        msg: 'get special problem in joined special contest'
    })
});


router.get('/contests/:contestId/problems/:problemId/solutions', (req, res) => {
    res.status(200).json({
        msg: 'get all solutions'
    })
});

router.get('/contests/:contestId/problems/:problemId/solutions/:solutionId', (req, res) => {
    res.status(200).json({
        msg: 'get all solutions'
    })
});

router.post('/contests/:contestId/problems/:problemId/solutions', (req, res) => {
    res.status(200).json({
        msg: 'create new solution'
    })
});

module.exports = router;