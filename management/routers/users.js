let express = require('express'),
    mongoose = require('mongoose'),
    crypto = require('crypto'),
    querystring = require('querystring'),
    validator = require('../utils/validator'),
    router = express.Router(),
    User = mongoose.model('User');

/**
 * show the users lists
 */
/* GET users */
router.get('/', (req, res, next) => {
    let search = req.query.search,
        limit = parseInt(req.query.limit, 10) || 10,
        page = parseInt(req.query.page) || 0,
        skip = (parseInt(req.query.skip, 10) || 0) + limit * page;
    let q = User.find();
    if (search) {
        q = q.regex('mail', `.*${search}.*`)
    }
    q.sort('mail')
        .skip(skip)
        .limit(limit)
        .select('mail displayName profileImageURL created activated disabled -_id')
        .exec((err, users) => {
            if (err) {
                return next(err);
            }
            let prevUrl = querystring.stringify({
                search, page: page - 1, limit
            }), nextUrl = querystring.stringify({
                search, page: page - 1, limit
            });
            res.render('users/index', {
                index: 2,
                users: users || [],
                form: {
                    search,
                    prev: {
                        enable: page > 0,
                        url: `/users${ prevUrl ? '?' + prevUrl : '' }`
                    },
                    next: {
                        enable: users.length >= limit,
                        url: `/users${ nextUrl ? '?' + nextUrl : '' }`
                    }
                },
                title: 'Manage Users'
            });
        });

});

/**
 * begin add user
 */
router.get('/add', (req, res, next) => {
    res.render('users/add', {
        index: 2,
        title: 'Manage Users',
        form: {
            activated: true
        }
    });
});

/**
 * save added user info
 */
router.post('/add', (req, res, next) => {
    let validation = [];
    if (!req.body.mail || !validator.isEmail(req.body.mail)) {
        validation.push({
            msg: 'Mail is empty or it is not valid email address'
        });
    }
    if (!req.body.password || req.body.password.length < 8 || validator.isNumeric(req.body.password)) {
        validation.push({
            msg: 'Password must be not empty, length must be great then 7, must be include non-numeric digits'
        });
    }
    if (req.body.password !== req.body.passwordVerify) {
        validation.push({
            msg: 'Two passwords are not match'
        });
    }
    if (validation.length > 0) {
        return res.render('users/add', {
            index: 2,
            title: 'Manage Users',
            validation: validation,
            form: {
                mail: req.body.mail,
                username: req.body.username,
                displayName: req.body.displayName,
                activated: req.body.activated
            }
        });
    }
    User.findOne({mail: req.body.mail}, (err, existedUser) => {
        if (err) {
            return next(err);
        }
        if (existedUser) {
            return res.render('users/add', {
                index: 2,
                title: 'Manage Users',
                validation: [{
                    msg: `Email "${req.body.mail}" is already registered`
                }],
                form: {
                    mail: req.body.mail,
                    username: req.body.username,
                    displayName: req.body.displayName,
                    activated: req.body.activated
                }
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
                return next(err);
            }
            return res.redirect('/users');
        });
    });
});

/**
 * begin edit the user
 */
router.get('/edit', (req, res, next) => {
    let mail = req.query.mail;
    if (!mail || !validator.isEmail(mail)) {
        return next(); // make a 404 response
    }
    User.findOne({mail: mail}, (err, user) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return next();
        }
        res.render('users/edit', {
            index: 2,
            title: 'Manage Users',
            form: user
        });
    });

});

/**
 * save edited user info
 */
router.post('/edit', (req, res, next) => {
    let feature = req.body.feature,
        uid = req.body.uid,
        validation = [];
    if (!feature || (feature !== 'basic' && feature !== 'password')) {
        validation.push({
            msg: 'illegal request, need valid parameter for feature'
        });
    }
    if (!uid) {
        validation.push({
            msg: 'missing used id to operated'
        });
    }
    let update = {};
    if (req.body.username) {
        update.username = req.body.username;
    }
    update.activated = !!req.body.activated;
    update.disabled = !!req.body.disabled;
    if (req.body.displayName) {
        update.displayName = req.body.displayName;
    }
    if (req.body.profileImageURL) {
        update.profileImageURL = req.body.profileImageURL;
    }
    User.findByIdAndUpdate(uid, update, {new: true}, (err, user) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return next();
        }
        res.render('users/edit', {
            index: 2,
            title: 'Manage Users',
            form: user
        });
    });
});


/**
 * begin edit the user
 */
router.get('/remove', (req, res, next) => {

});

/**
 * save edited user info
 */
router.post('/remove', (req, res, next) => {

});

module.exports = router;