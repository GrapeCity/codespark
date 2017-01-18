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
        res.locals.validation = ['用户名或者密码错误，请稍后重试！'];
        res.locals.form = req.body;
        return res.render('users/login');
    }
    if (!user.activated) {
        res.locals.validation = ['该用户未激活，请检查注册时使用的邮箱，并使用其中的激活链接激活注册用户'];
        res.locals.form = req.body;
        return res.render('users/login');
    }

    return res.redirect(req.query.returnUrl || '/');
}

function preLogin(req, res, next) {
    let {mail, password} = req.body;
    if (!mail || !validator.isEmail(mail)) {
        res.locals.validation = ['邮箱不能为空或者不是合法邮箱！'];
        res.locals.form = req.body;
        return res.render('users/login');
    }
    if (!password) {
        res.locals.validation = ['密码不能为空！'];
        res.locals.form = req.body;
        return res.render('users/login');
    }
    next();
}

function createSignupHandle(config) {
    return function signup(req, res, next) {
        let {mail, password, grapecity} = req.body;
        if (!mail || !validator.isEmail(mail)) {
            res.locals.validation = ['用户邮箱为空或者不是合法邮箱'];
            res.locals.form = req.body;
            return res.render('users/signup');
        }
        User.findOne({mail}, (err, existedUser) => {
            if (err) {
                logger.error(`Database error: ${err}`);
                return next(err);
            }
            if (existedUser) {
                res.locals.validation = ['该邮件已经被注册过'];
                res.locals.form = req.body;
                return res.render('users/signup');
            }

            new Promise((resolve, reject) => {
                if (grapecity || mail.slice(-14) === '@grapecity.com') {
                    adLogin(config, mail, password, (err, userInfo) => {
                        if (err) {
                            err.status = 500;
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

                if (user && !user.activated) {
                    // send mail
                    createActivateLink(
                        `${req.header('X-Forwarded-Proto') || req.protocol || 'http'}://${req.header('host')}`,
                        mail,
                        user.activeToken
                    ).then(link => {
                        sendActivateEmail(mail, link);
                    }).catch(err => {
                        logger.warn(`there is an error: ${err}`);
                    });
                }
                if (user && user.activated) {
                    passport.authenticate('local')(req, res, () => res.redirect('/dashboard'));
                } else {
                    res.locals.validation = [];
                    res.locals.form = {
                        created: true,
                        message: `用户（邮箱：${mail}）已创建并发送激活链接，请检查邮箱！`
                    };
                    return res.render('users/signup');
                }
            }).catch((err) => {
                res.locals.validation = [`无法创建用户（邮箱：${mail}）: ${err}，请和管理员联系`];
                res.locals.form = req.body;
                return res.render('users/signup');
            });
        })
    };
}

function sendActivateEmail(mail, link) {
    console.log(`mail=${mail}, linnk=${link}`)
}

function createActivateLink(host, mail, activeToken) {
    return new Promise((resolve, reject) => {
        try {
            let nonce = crypto.randomBytes(4).toString('hex'),
                random = crypto.randomBytes(3).toString('base64'),
                cipher = crypto.createCipher('rc4', nonce),
                encrypted = '';
            cipher.on('readable', () => {
                let data = cipher.read();
                if (data) {
                    encrypted += data.toString('hex');
                }
            });
            cipher.on('end', () => {
                resolve(`${host}/users/active?token=${encrypted}&nonce=${nonce}`);
            });

            cipher.write(JSON.stringify({m: mail, a: activeToken, r: random}));
            cipher.end();
        } catch (any) {
            reject(any);
        }
    });
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
        app.post('/login', preLogin, passportLogin, postLogin);
        app.post('/signup', createSignupHandle(config));
    },
    ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            res.locals.user = req.user;
            return next();
        }
        res.redirect(`/login?returnUrl=${req.originalUrl}`);
    }
};

