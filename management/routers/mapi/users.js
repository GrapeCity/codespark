let express = require('express'),
    mongoose = require('mongoose'),
    crypto = require('crypto'),
    validator = require('../../utils/validator'),
    basicAuth = require('../../utils/basicAuth'),
    router = express.Router(),
    User = mongoose.model('User');

if(process.env.MAPI_USER){
    router.use(basicAuth(process.env.MAPI_USER,
        process.env.MAPI_PASSWORD || process.env.MAPI_USER));
}

/**
 * Create a new user
 */
/* POST mapi/users */
router.post('/', (req, res, next) => {
    if (!req.body.mail || !validator.isEmail(req.body.mail)) {
        return res.status(400).json({
            err: true,
            msg: 'Mail is empty or it is not valid email address',
            timestamp: new Date().getTime()
        });
    }
    if (!req.body.password || req.body.password.length < 8 || validator.isNumeric(req.body.password)) {
        return res.status(400).json({
            err: true,
            msg: 'Password must be not empty, length must be great then 7, must be include non-numeric digits',
            timestamp: new Date().getTime()
        });
    }
    User.findOne({mail: req.body.mail}, (err, existedUser) => {
        if (err) {
            return res.status(500).json({
                err: true,
                msg: `Internal error: ${err}`,
                timestamp: new Date().getTime()
            });
        }
        if (existedUser) {
            return res.status(400).json({
                err: true,
                msg: `Email "${req.body.mail}" Already registered`,
                timestamp: new Date().getTime()
            });
        }
        let username = req.body.username || req.body.mail.substr(0, req.body.mail.indexOf('@')).replace('.', '');
        let displayName = req.body.displayName || username;
        let user = new User({
            provider: 'local',
            mail: req.body.mail,
            password: req.body.password,
            username: username,
            displayName: displayName,
            activated: true,
            activeToken: crypto.randomBytes(12).toString('base64'), // 16 characters
            activeExpires: new Date(new Date().getTime() + (2 * 24 * 60 * 60 * 1000)) // two days
        });
        user.save(err => {
            if (err) {
                return res.status(500).json({
                    err: true,
                    msg: `Save to database failed: ${err}`
                });
            }
            res.status(201).json({
                mail: user.mail,
                username: user.username,
                displayName: user.displayName,
                activated: true
            });
        });
    });
});

module.exports = router;