let express = require('express'),
    utils = require('../utils'),
    ProblemRepository = require('../repositories/problemRepository'),
    logger = utils.winston.appLogger,
    router = express.Router();

router.get('/:problemId', (req, res) => {
    let problem = req.params.problemId,
        problemRepo = new ProblemRepository();
    problemRepo.findById(problem, '', true)
        .then(data=> {
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

module.exports = router;
