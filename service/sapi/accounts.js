let express = require('express'),
    crypto = require('crypto'),
    validator = require('validator'),
    utils = require('../utils'),
    mongoose = utils.mongoose,
    logger = utils.winston.appLogger,
    router = express.Router(),
    User = mongoose.model('User'),
    UserRepository = require('../repositories/userRepository');

router.get('/me', (req, res) => {
    let userRepo = new UserRepository();
    userRepo.findByIdAndPopulate(req.user._id)
        .then((user) => res.status(200).json(user))
        .catch((err) => {
            logger.error(`Read data from mongodb error: ${err}`);
            res.status(500).json({
                err: true,
                msg: '读取用户元数据出错！'
            })
        });
});

module.exports = router;