let express           = require('express'),
    crypto            = require('crypto'),
    auth              = require('../utils/auth'),
    utils             = require('../utils'),
    sendgrid          = require('sendgrid'),
    logger            = utils.winston.appLogger,
    router            = express.Router(),
    UserRepository    = require('../repositories/userRepository'),
    ContestRepository = require('../repositories/contestRepository');

router.get('/', (req, res, next) => {
    let contestRepo = new ContestRepository();
    contestRepo.getLatestActiveInfo()
        .then(contest => {
            res.locals.user    = req.user;
            res.locals.contest = contest;
            res.render('index');
        })
        .catch(err => {
            if (err.status === 404) {
                res.locals.user = req.user;
                return res.render('index');
            }
            next(err);
        });
});

router.get('/rules', (req, res, next) => {
    res.locals.user  = req.user;
    res.locals.rules = [];
    res.render('rules');
});

router.get('/videos', (req, res, next) => {
    res.locals.user   = req.user;
    res.locals.videos = [];
    res.render('videos');
});

router.get('/debug', (req, res, next) => {
    res.locals.user  = req.user;
    res.locals.forms = {};
    res.render('debug');
});

router.get('/login', (req, res, next) => {
    res.locals.validation = [];
    res.locals.form       = {};
    res.render('users/login');
});

router.post('/logout', auth.ensureAuthenticated, (req, res, next) => {
    req.session.destroy();
    req.logout();
    res.redirect('/');
});

router.get('/signup', (req, res, next) => {
    res.locals.validation = [];
    res.locals.form       = {};
    res.render('users/signup');
});

router.get('/active', (req, res) => {
    let {token, nonce} = req.query;
    if (!token || !nonce) {
        res.locals.validation = ['参数不正确，请重新输入'];
        return res.render('users/active');
    }
    let decipher  = crypto.createDecipher('rc4', nonce),
        decrypted = '';
    decipher.on('readable', () => {
        let data = decipher.read();
        if (data) {
            decrypted += data.toString('utf8');
        }
    });
    decipher.on('end', () => {
        // Prints: some clear text data
        try {
            let data        = JSON.parse(decrypted),
                mail        = data.m,
                activeToken = data.a,
                userRepo    = new UserRepository();
            userRepo.findOneByMail(mail)
                .then(user => {
                    if (!user ||
                        user.activated ||
                        user.activeToken !== activeToken ||
                        user.activeExpires < new Date()) {
                        res.locals.validation = ['激活失败：用户不存在或者已经激活或者激活链接已失效'];
                        return res.render('users/active');
                    }
                    user.activated     = true;
                    user.activeExpires = new Date();
                    user.save((err) => {
                        if (err) {
                            logger.error(`database error: ${err}`);
                            return res.render('error/500');
                        }
                        res.locals.validation = ['激活成功'];
                        return res.render('users/active');
                    });
                })
                .catch(err => {
                    logger.error(`database error: ${err}`);
                    res.locals.validation = ['参数不正确，请检查参数'];
                    return res.render('users/active');
                })
        } catch (any) {
            logger.warn(`parse activate parameters error: ${any}`);
            res.locals.validation = ['参数不正确，请检查参数'];
            return res.render('users/active');
        }
    });

    decipher.write(token, 'hex');
    decipher.end();
});

router.get('/forget', (req, res) => {
    res.locals.validation = [];
    res.locals.form       = {};
    res.locals.mailSent   = false;
    return res.render('users/forget');
});

router.post('/forget', (req, res) => {
    res.locals.form     = req.body;
    res.locals.mailSent = false;
    let {mail}          = req.body;
    if (!mail || !validator.isEmail(mail)) {
        res.locals.validation = ['用户邮箱为空或者不是合法邮箱'];
        return res.render('users/forget');
    }
    mail         = mail.toLowerCase();
    let userRepo = new UserRepository();
    userRepo.findOneByMail(mail).then(user => {
        if (user || user.activated) {

            user.resetPasswordToken   = crypto.randomBytes(12).toString('base64'); // 16 characters
            user.resetPasswordExpires = new Date(new Date().getTime() + (2 * 24 * 60 * 60 * 1000)); // two days
            user.save((err) => {
                if (err) {
                    logger.error('Save database error: %s %s', err, err.stack);
                    res.locals.validation = ['服务器发生错误，请稍后重试或者联系管理员'];
                    return res.render('users/forget');
                }

                // send mail
                createResetLink(
                    `${req.header('X-Forwarded-Proto') || req.protocol || 'http'}://${req.header('host')}`,
                    mail,
                    user.resetPasswordToken
                ).then(link => {
                    sendResetEmail(mail, link);
                }).catch(err => {
                    logger.warn(`there is an error: ${err}`);
                });
            });
        }
        res.locals.mailSent   = true;
        res.locals.validation = [`已发送重置密码的邮件到${mail}，请注意查收，并按照邮件提示步骤重置密码`];
        return res.render('users/forget');
    }).catch(err => {
        logger.error('Query database error: %s %s', err, err.stack);
        res.locals.validation = ['服务器发生错误，请稍后重试或者联系管理员'];
        return res.render('users/forget');
    });
});

router.get('/reset', (req, res) => {
    let {token, nonce}  = req.query;
    res.locals.mailSent = false;
    if (!token || !nonce) {
        res.locals.validation = ['参数不正确，请重新输入'];
        return res.render('users/forget');
    }
    let decipher  = crypto.createDecipher('rc4', nonce),
        decrypted = '';
    decipher.on('readable', () => {
        let data = decipher.read();
        if (data) {
            decrypted += data.toString('utf8');
        }
    });
    decipher.on('end', () => {
        // Prints: some clear text data
        try {
            let data        = JSON.parse(decrypted),
                mail        = data.m,
                activeToken = data.a,
                userRepo    = new UserRepository();
            userRepo.findOneByMail(mail)
                .then(user => {
                    if (!user ||
                        user.activated ||
                        user.activeToken !== activeToken ||
                        user.activeExpires < new Date()) {
                        res.locals.validation = ['用户不存在或者重置密码链接已失效'];
                        return res.render('users/forget');
                    }
                    user.activated     = true;
                    user.activeExpires = new Date();
                    user.save((err) => {
                        if (err) {
                            logger.error(`database error: ${err}`);
                            return res.render('error/500');
                        }
                        res.locals.validation = ['重置密码成功'];
                        res.locals.mailSent   = true;
                        return res.render('users/forget');
                    });
                })
                .catch(err => {
                    logger.error(`database error: ${err}`);
                    res.locals.validation = ['参数不正确，请检查参数'];
                    return res.render('users/forget');
                })
        } catch (any) {
            logger.warn(`parse activate parameters error: ${any}`);
            res.locals.validation = ['参数不正确，请检查参数'];
            return res.render('users/forget');
        }
    });

    decipher.write(token, 'hex');
    decipher.end();
});

module.exports = router;


function createResetLink(host, mail, resetToken) {
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
                resolve(`${host}/reset?token=${encrypted}&nonce=${nonce}`);
            });

            cipher.write(JSON.stringify({m: mail, a: resetToken, r: random}));
            cipher.end();
        } catch (any) {
            reject(any);
        }
    });
}

function sendResetEmail(mailAddress, link) {
    console.log(`mail=${mailAddress}, linnk=${link}`);

    let helper     = sendgrid.mail,
        from_email = new helper.Email('contest@grapecity.com', '葡萄城编程挑战赛'),
        to_email   = new helper.Email(mailAddress),
        subject    = '欢迎参加葡萄城编程挑战赛!',
        content    = new helper.Content('text/plain', `您好，${mailAddress}，
    欢迎参加葡萄城编程挑战赛！
 
    您使用本邮箱申请重置密码操作（如非本人操作请忽略），请点击下方的链接（或拷贝到浏览器地址栏直接访问），以重置密码：
    ${link}`),
        mail       = new helper.Mail(from_email, subject, to_email, content);

    let sendgridApi = new sendgrid(
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