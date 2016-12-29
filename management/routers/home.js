let express = require('express'),
    mapiSecurity = require('../utils').mapiSecurity,
    router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        index: 1,
        title: 'Contest Management',
        form: {},
        accessToken: mapiSecurity.accessToken()
    });
});

module.exports = router;