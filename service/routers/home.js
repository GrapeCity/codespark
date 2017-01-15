let express           = require('express'),
    crypto            = require('crypto'),
    auth              = require('../utils/auth'),
    utils             = require('../utils'),
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
                res.render('index');
            }
            next(err);
        });
});

router.get('/rules', (req, res, next) => {
    res.locals.rules = [];
    res.render('rules');
});

router.get('/videos', (req, res, next) => {
    res.locals.videos = [];
    res.render('videos');
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
                        user.activeExpires > new Date()) {
                        res.locals.validation = ['激活失败：用户不存在或者已经激活或者激活链接已失效'];
                        return res.render('users/active');
                    }
                    res.locals.validation = ['激活成功'];
                    return res.render('users/active');
                })
                .catch(err => {
                    logger.warn(`database error: ${err}`);
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

router.get('/forget', auth.ensureAuthenticated, (req, res) => {
    res.locals.validation = [];
    res.locals.form       = {};
    return res.render('users/forget');
});

router.post('/forget', auth.ensureAuthenticated, (req, res) => {
    res.locals.validation = [];
    res.locals.form       = req.body;
    return res.render('users/forget');
});

module.exports = router;