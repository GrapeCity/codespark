let express = require('express'),
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