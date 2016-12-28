let express = require('express'),
    crypto = require('crypto'),
    utils = require('../utils'),
    logger = utils.winston.appLogger,
    router = express.Router(),
    UserRepository = require('../repositories/userRepository');

router.get('/active', (req, res) => {
    let {token, nonce} = req.query;
    if (!token || !nonce) {
        return res.send('参数不正确，请重新输入');
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
                        return res.send('激活失败：用户不存在或者已经激活或者激活链接已失效');
                    }
                    res.send('激活成功');
                })
                .catch(err => {
                    logger.warn(`database error: ${err}`);
                    return res.send('参数不正确，请重新输入');
                })
        } catch (any) {
            logger.warn(`parse activate parameters error: ${any}`);
            return res.send('参数不正确，请重新输入');
        }
    });

    decipher.write(token, 'hex');
    decipher.end();
});

module.exports = (app) => {
    app.use('/users', router);
};