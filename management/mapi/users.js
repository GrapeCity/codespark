let express = require('express'),
    crypto = require('crypto'),
    validator = require('validator'),
    utils = require('../utils'),
    mongoose = utils.mongoose,
    logger = utils.winston.appLogger,
    router = express.Router(),
    User = mongoose.model('User');

router.get('/:mail', (req, res, next) => {
    let mail = req.params.mail;
    if (!mail || !validator.isEmail(mail)) {
        return res.status(400).json({
            err: true,
            msg: 'mail is not well formatted',
            timestamp: new Date().getTime()
        });
    }
    User.findOne({mail})
        .exec((err, user) => {
            if (err) {
                return next(err);
            }
            return res.status(200).json(user);
        });
});

module.exports = router;