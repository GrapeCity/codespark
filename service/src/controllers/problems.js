let mongoose = require('mongoose'),
    config = require('../config'),
    logger = require('../utils/winston').appLogger,
    User = mongoose.model('User'),
    Contest = mongoose.model('Contest'),
    Problem = mongoose.model('Problem');

module.exports = function (server) {

    function getAllProblemsByContest(req, res) {
        let contestName = req.params.contest || '';
        if (contestName === '') {
            return res.status(200).json([]);
        }
        Contest.findOne({name: contestName})
            .populate('problems', 'title description')
            .exec((err, contest) => {
                if (err) {
                    logger.error(`Read data from mongodb error: ${err}`);
                    return res.status(500).json({
                        err: true,
                        msg: '读取编程竞赛题目元数据出错！'
                    });
                }
                if (!contest) {
                    return res.status(404).json({
                        err: true,
                        msg: '编程赛事(' + contestName + ')不存在！'
                    });
                }
                return res.status(200).json(contest.problems);
            });
    }

    function getAllProblemByIdWithContest(req, res) {
        let contestName = req.params.contest || '',
            problemTitle = req.params.problem || '';
        if (contestName === '' || problemTitle === '') {
            return res.status(200).json({});
        }
        Contest.findOne({name: contestName})
            .populate('problems', 'title description', Problem, {title: problemTitle})
            .exec((err, contest) =>{
                if (err) {
                    logger.error(`Read data from mongodb error: ${err}`);
                    return res.status(500).json({
                        err: true,
                        msg: '读取编程竞赛题目元数据出错！'
                    });
                }
                if (!contest) {
                    return res.status(404).json({
                        err: true,
                        msg: '编程赛事(' + contestName + ')不存在！'
                    });
                }
                return res.status(200).json(contest.problems);
            });
    }

    return {
        getAllProblemsByContest: getAllProblemsByContest,
        getAllProblemByIdWithContest: getAllProblemByIdWithContest
    };
};