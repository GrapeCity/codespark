let express = require('express'),
    crypto = require('crypto'),
    utils = require('../utils'),
    logger = utils.winston.appLogger,
    router = express.Router(),
    UserRepository = require('../repositories/userRepository'),
    ContestRepository = require('../repositories/contestRepository');

router.get('/', (req, res) => {
    let contestRepo = new ContestRepository();
    contestRepo.getLatestActiveInfo(!req.user || req.user.mail.slice(-14) !== '@grapecity.com')
        .then(contest => {
            res.render('index', {contest});
        })
        .catch(err => {
            res.render('index', {err});
        });
});

router.get('/login', (req, res, next) => {
    res.render('users/login', {});
});

router.get('/signup', (req, res, next) => {
    res.render('users/signup', {});
});

router.get('/active', (req, res) => {
    let {token, nonce} = req.query;
    if (!token || !nonce) {
        return res.render('users/active', {msg: '参数不正确，请重新输入'});
    }
    let decipher = crypto.createDecipher('rc4', nonce),
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
            let data = JSON.parse(decrypted),
                mail = data.m,
                activeToken = data.a,
                userRepo = new UserRepository();
            userRepo.findOneByMail(mail)
                .then(user => {
                    if (!user ||
                        user.activated ||
                        user.activeToken !== activeToken ||
                        user.activeExpires > new Date()) {
                        return res.render('users/active', {msg: '激活失败：用户不存在或者已经激活或者激活链接已失效'});
                    }
                    return res.render('users/active', {msg: '激活成功'});
                })
                .catch(err => {
                    logger.warn(`database error: ${err}`);
                    return res.render('users/active', {msg: '参数不正确，请检查参数'});
                })
        } catch (any) {
            logger.warn(`parse activate parameters error: ${any}`);
            return res.render('users/active', {msg: '参数不正确，请检查参数'});
        }
    });

    decipher.write(token, 'hex');
    decipher.end();
});

router.get('/forget', (req, res) => {
    return res.render('users/forget', {form: {}});
});

router.post('/forget', (req, res) => {
    return res.render('users/forget', {form: req.body});
});

module.exports = router;