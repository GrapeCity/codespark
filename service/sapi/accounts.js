let express = require('express'),
    utils = require('../utils'),
    logger = utils.winston.appLogger,
    router = express.Router(),
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