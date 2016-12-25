let express = require('express'),
    utils = require('../utils'),
    // mongoose = utils.mongoose,
    // logger = utils.winston.appLogger,
    router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        index: 1,
        title: 'Contest Management',
        form: {}
    });
});

module.exports = router;