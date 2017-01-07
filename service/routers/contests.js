let express = require('express'),
    utils = require('../utils'),
    logger = utils.winston.appLogger,
    router = express.Router(),
    ContestRepository = require('../repositories/contestRepository');

router.get('/:name', (req, res, next) => {
    let name = req.params.name,
        contestRepo = new ContestRepository();

    contestRepo.findByName(name)
        .then(contest => {
            Promise.all([
                contestRepo.findOneByIdAndUser(contest._id, req.user._id),
                contestRepo.getTop10(contest._id)
            ]).then(data => {
                res.locals.validation = [];
                res.locals.form = {
                    board: data[0],
                    contest: contest,
                    top10: data[1]
                };
                return res.render('contest/index');
            }).catch(err => {
                if (err.status === 404) {
                    res.locals.validation = [`竞赛（${name}）不存在，或者你没有加入该竞赛，请从<a href="/dashboard">dashboard</a>页面重试`];
                    return res.render('contest/error');
                }
                next(err);
            });
        })
        .catch(err => {
            res.locals.validation = [`竞赛（${name}）不存在`];
            return res.render('contest/error');
        });
});

module.exports = router;