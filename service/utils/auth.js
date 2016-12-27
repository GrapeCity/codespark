let http = require('http'),
    crypto = require('crypto'),
    passport = require('passport'),
    validator = require('validator'),
    _ = require('lodash'),
    utils = require('../utils'),
    mongoose = utils.mongoose,
    User = mongoose.model('User'),
    logger = utils.winston.appLogger;

function passportLogin(req, res, next) {
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
}

function postLogin(req, res) {
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
}

function createSignupHandle(config) {
    return function signup(req, res) {
        let {mail, password, grapecity} = req.body;
        if (!mail || !validator.isEmail(mail)) {
            return res.status(400).json({
                err: true,
                msg: '用户邮箱为空或者不是合法邮箱',
                timestamp: new Date().getTime()
            });
        }
        User.findOne({mail}, (err, existedUser) => {
            if (err) {
                logger.error(`Database error: ${err}`);
                return res.status(500).json({
                    err: true,
                    msg: '内部错误导致注册失败，请联系管理员!',
                    timestamp: new Date().getTime()
                });
            }
            if (existedUser) {
                return res.status(400).json({
                    err: true,
                    msg: '该邮件已经被注册过',
                    timestamp: new Date().getTime()
                });
            }

            new Promise((resolve, reject) => {
                if (grapecity || mail.slice(-14) === '@grapecity.com') {
                    adLogin(config, mail, password, (err, userInfo) => {
                        if (err) {
                            err.code = 500;
                            return reject(err);
                        }
                        if (!userInfo) {
                            return reject(new Error('无法访问到域控制器'));
                        }
                        createLocalUser(mail, password,
                            userInfo.userName, userInfo.displayName,
                            true, resolve, reject);
                    });
                } else {
                    let {username, displayName} = req.body;
                    username = username || mail.substr(0, req.body.mail.indexOf('@'));
                    displayName = displayName || username;
                    createLocalUser(mail, password,
                        username, displayName,
                        false, resolve, reject);
                }
            }).then((user) => {
                passport.authenticate('local')(req, res, () =>
                    res.status(201).json({
                        mail: user.mail,
                        username: user.username,
                        displayName: user.displayName,
                        activated: user.activated
                    }));
            }).catch((err) => {
                res.status(err.code || 400).json({
                    err: true,
                    msg: `无法创建用户（邮箱：${mail}）: ${err}，请和管理员联系`,
                    timestamp: new Date().getTime()
                });
            });
        })
    };
}

function createLocalUser(mail, password, username, displayName, adUser, resolve, reject) {
    let user = new User({
        provider: 'local',
        mail: mail,
        password: password,
        username: username,
        displayName: displayName,
        activated: adUser,
        activeToken: crypto.randomBytes(12).toString('base64'), // 16 characters
        activeExpires: new Date(new Date().getTime() + (2 * 24 * 60 * 60 * 1000)) // two days
    });
    user.save(function (err) {
        if (err) {
            reject(err);
        }
        if (!adUser) {
            // send mail
        }
        resolve(user);
    })
}

function adLogin(config, mail, password, next) {
    let timeoutHandler,
        req = http.request({
            host: config.host,
            port: config.port,
            path: config.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, res => {
            // require accepted
            clearTimeout(timeoutHandler);

            // response timeout due to large stream?
            timeoutHandler = setTimeout(function () {
                res.destroy();
                next(new Error("获取HTTP响应流超时"));
            }, 5000);

            let succeeded = (res.statusCode == 200);
            res.setEncoding('utf8');

            // all data must be less than 65535 strings
            let resBody = "";
            res.on('data', data => {
                resBody += data;
            });

            res.on('end', () => {
                // data ready
                clearTimeout(timeoutHandler);

                // process data
                let userInfo = null;
                if (succeeded) {
                    try {
                        userInfo = JSON.parse(resBody);
                        next(null, userInfo);
                    } catch (any) {
                        next(any, userInfo);
                    }
                } else {
                    next(new Error(resBody), userInfo);
                }
            });
        });
    req.on('error', err => {
        clearTimeout(timeoutHandler);
        next(err, null);
    });
    req.write(JSON.stringify({mail: mail, password: password}));
    req.end();

    // performance: make sure require must be back in 5 seconds
    timeoutHandler = setTimeout(function () {
        req.abort();
    }, 5000);
}

module.exports = {
    setup(app, config) {
        app.post('/sapi/accounts/login', passportLogin, postLogin);
        app.post('/sapi/accounts/signup', createSignupHandle(config));
    },
    ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.status(401).json({
            err: true,
            msg: '未登录或者未授权的访问'
        });
    }
};

