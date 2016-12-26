let express = require('express'),
    crypto = require('crypto'),
    validator = require('validator'),
    passport = require('passport'),
    utils = require('../utils'),
    mongoose = utils.mongoose,
    logger = utils.winston.appLogger,
    router = express.Router(),
    User = mongoose.model('User');


module.exports = {
    ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.status(401).json({
            err: true,
            msg: '未登录或者未授权的访问'
        });
    },
    signup(req, res, next) {
        res.status(500).json({
            err: true,
            msg: 'Not implement'
        });
    },
    login(req, res, next) {
        passport.authenticate('local', (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                logger.warn('user [%s] login failed from [%s], reason: [%s]',
                    req.body.mail,
                    (req.headers["X-Forwarded-For"] || req.headers["x-forwarded-for"] || '').split(',')[0] || req.client.remoteAddress,
                    info && info.msg);
                return next();
            }
            req.logIn(user, err => {
                if (err) {
                    return next(err);
                }
                next();
            });
        })(req, res, next);
    },
    postLogin(req, res, next) {
        let user = req.user;
        if (!user) {
            return res.status(401).json({
                err: true,
                msg: '用户名或者密码错误，请稍后重试！'
            });
        }
        if (!user.activated) {
            return res.status(400).json({
                err: true,
                msg: '该用户未激活，请检查注册时使用的邮箱，并使用其中的激活链接激活注册用户',
                timestamp: new Date().getTime()
            });
        }

        return res.status(200).json({
            mail: user.mail,
            username: user.username,
            displayName: user.displayName,
            activated: user.activated
        });
    },
    router
};