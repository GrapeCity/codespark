let http      = require('http'),
    crypto    = require('crypto'),
    passport  = require('passport'),
    validator = require('validator'),
    _         = require('lodash'),
    utils     = require('../utils'),
    sendgrid  = require('sendgrid'),
    mongoose  = utils.mongoose,
    User      = mongoose.model('User'),
    logger    = utils.winston.appLogger;

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
        res.locals.form       = req.body;
        return res.render('users/login');
    }
    if (!user.activated) {
        res.locals.validation = ['该用户未激活，请检查注册时使用的邮箱，并使用其中的激活链接激活注册用户'];
        res.locals.form       = req.body;
        return res.render('users/login');
    }

    return res.redirect(req.query.returnUrl || '/');
}

function preLogin(req, res, next) {
    let {mail, password} = req.body;
    if (!mail || !validator.isEmail(mail)) {
        res.locals.validation = ['邮箱不能为空或者不是合法邮箱！'];
        res.locals.form       = req.body;
        return res.render('users/login');
    }
    if (!password) {
        res.locals.validation = ['密码不能为空！'];
        res.locals.form       = req.body;
        return res.render('users/login');
    }
    next();
}

function createSignupHandle(config) {
    return function signup(req, res, next) {
        let {mail, password} = req.body;
        if (!mail || !validator.isEmail(mail)) {
            res.locals.validation = ['用户邮箱为空或者不是合法邮箱'];
            res.locals.form       = req.body;
            return res.render('users/signup');
        }
        // Fix for all variant typing with email
        // -------------------------
        mail = mail.toLowerCase();
        // -------------------------

        User.findOne({mail}, (err, existedUser) => {
            if (err) {
                logger.error(`Database error: ${err}`);
                return next(err);
            }
            if (existedUser) {
                res.locals.validation = ['该邮件已经被注册过'];
                res.locals.form       = req.body;
                return res.render('users/signup');
            }

            new Promise((resolve, reject) => {
                let {username, displayName} = req.body;
                username                    = username || req.body.mail.substr(0, req.body.mail.indexOf('@'));
                displayName                 = displayName || username;
                createLocalUser(mail, password,
                    username, displayName,
                    false, resolve, reject);
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
                    res.locals.form       = {
                        created: true,
                        message: `用户（邮箱：${mail}）已创建并发送激活链接，请检查邮箱！`
                    };
                    return res.render('users/signup');
                }
            }).catch((err) => {
                res.locals.validation = [`无法创建用户（邮箱：${mail}）: ${err}，请和管理员联系`];
                res.locals.form       = req.body;
                return res.render('users/signup');
            });
        })
    };
}

function sendActivateEmail(mailAddress, link) {
    console.log(`mail=${mailAddress}, linnk=${link}`);

    let helper     = sendgrid.mail,
        from_email = new helper.Email('contest@grapecity.com', '葡萄城编程挑战赛'),
        to_email   = new helper.Email(mailAddress),
        subject    = '欢迎参加葡萄城编程挑战赛!',
        content    = new helper.Content('text/plain', `您好，${mailAddress}，
    欢迎参加葡萄城编程挑战赛！
 
    感谢您注册葡萄城编程挑战赛系统，开启挑战之道，还需要点击下方的链接（或拷贝到浏览器地址栏直接访问），以激活您的账号：
    ${link}`),
        mail       = new helper.Mail(from_email, subject, to_email, content);

    let sendgridApi = new sendgrid.Email(
        process.env.SENDGRID_API_KEY || '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');
    let request     = sendgridApi.emptyRequest({
        method: 'POST',
        path  : '/v3/mail/send',
        body  : mail.toJSON(),
    });
    sendgridApi.API(request, function (error, response) {
        if (error) {
            logger.error('send email failed: %s\r\n%s', error, error.stack);
            return;
        }
        logger.info('send email succeed, response {status:%s, body:%s}',
            response.statusCode, response.body);
    });
}

function createActivateLink(host, mail, activeToken) {
    return new Promise((resolve, reject) => {
        try {
            let nonce     = crypto.randomBytes(4).toString('hex'),
                random    = crypto.randomBytes(3).toString('base64'),
                cipher    = crypto.createCipher('rc4', nonce),
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
        provider     : 'local',
        mail         : mail,
        password     : password,
        username     : username,
        displayName  : displayName,
        activated    : adUser,
        activeToken  : crypto.randomBytes(12).toString('base64'), // 16 characters
        activeExpires: new Date(new Date().getTime() + (2 * 24 * 60 * 60 * 1000)) // two days
    });
    user.save(function (err) {
        if (err) {
            reject(err);
        }
        resolve(user);
    })
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

