let express = require('express'),
    crypto = require('crypto'),
    validator = require('validator'),
    utils = require('../utils'),
    mongoose = utils.mongoose,
    logger = utils.winston.appLogger,
    router = express.Router(),
    User = mongoose.model('User');

router.get('/:mail', (req, res, next) => {

});

module.exports = router