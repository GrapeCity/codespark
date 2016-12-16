var mongoose = require('mongoose'),
    config = require('../config'),
    logger = require('../utils/winston').appLogger,
    User = mongoose.model('User'),
    Contest = mongoose.model('Contest');


module.exports = function (server) {

    function getAllContests(req, res) {
        Contest.find()
            .limit(parseInt(req.query.limit, 10) || 5)
            .skip(parseInt(req.query.skip, 10) || 0)
            .exec(function (err, contests) {
                if (err) {
                    logger.error('Read data from mongodb error: %s', err);
                    return res.status(500).json({
                        err: true,
                        msg: '读取编程竞赛元数据出错！'
                    });
                }
                return res.status(200).json(contests);
            });
    }

    function getAllContestsByUser(req, res) {
        User.findById(req.user._id)
            .populate('contests')
            .exec(function (err, user) {
                if (err) {
                    logger.error('Read data from mongodb error: %s', err);
                    return res.status(500).json({
                        err: true,
                        msg: '读取编程竞赛元数据出错！'
                    });
                }
                return res.status(200).json(user.contests);
            });
    }

    return {
        getAllContests: getAllContests,
        getAllContestsByUser: getAllContestsByUser
    };
};