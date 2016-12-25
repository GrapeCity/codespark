let express = require('express'),
    utils = require('../utils'),
    mongoose = utils.mongoose,
    logger = utils.winston.appLogger,
    router = express.Router();

/* GET status page. */
router.get('/', function (req, res, next) {
    res.render('status', {
        index: 5,
        title: 'Status',
        form: {}
    });
});

module.exports = router;