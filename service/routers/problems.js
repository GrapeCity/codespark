let express = require('express'),
    utils = require('../utils'),
    logger = utils.winston.appLogger,
    router = express.Router(),
    ProblemRepository = require('../repositories/problemRepository');

router.get('/:name', (req, res) => {
    res.render('contest/index', {});
});

router.post('/:name', (req, res) => {
    res.render('contest/index', {});
});

module.exports = router;