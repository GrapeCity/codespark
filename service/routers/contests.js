let express = require('express'),
    utils = require('../utils'),
    logger = utils.winston.appLogger,
    router = express.Router(),
    ContestRepository = require('../repositories/contestRepository');

router.get('/:name', (req, res) => {
    res.render('contest/index', {});
});

module.exports = router;