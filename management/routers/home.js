let express = require('express'),
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