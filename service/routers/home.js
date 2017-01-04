let express = require('express'),
    crypto = require('crypto'),
    utils = require('../utils'),
    auth = require('../utils/auth'),
    users = require('./users'),
    logger = utils.winston.appLogger,
    router = express.Router(),
    UserRepository = require('../repositories/userRepository');

router.get('/', (req, res, next) => {
    res.render('index', {});
});

router.get('/login', (req, res, next) => {
    res.render('users/login', {});
});

router.post('/login', (req, res, next) => {

});

router.get('/signup', (req, res, next) => {
    res.render('users/signup', {});
});

module.exports = router;