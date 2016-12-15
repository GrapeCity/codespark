var mongoose = require('mongoose'),
    config = require('../config'),
    logger = require('../utils/winston').appLogger,
    Contest = mongoose.model('Contest');


module.exports = function (server) {

    function getAllContests(req, res) {
        Contest.find()
            .limit(req.query.top || 5)
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


    return {
        getAllContests: getAllContests
    };
};