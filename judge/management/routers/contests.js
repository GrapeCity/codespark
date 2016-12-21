let express = require('express'),
    router = express.Router();

/* GET contests page. */
router.get('/', function (req, res, next) {
    res.render('contests/index', {index: 3, title: 'Contests'});
});

module.exports = router;