let express           = require('express'),
    _                 = require('lodash'),
    moment            = require('moment'),
    utils             = require('../utils'),
    logger            = utils.winston.appLogger,
    router            = express.Router(),
    ContestRepository = require('../repositories/contestRepository');

router.get('/', (req, res, next) => {
    let contestRepo = new ContestRepository();
    contestRepo.findActiveContests(req.user.mail.slice(-14) !== '@grapecity.com', '-end')
        .then(contests => {
            res.locals.validation = [];
            res.locals.form       = {};
            if (contests && contests.length > 0) {
                let contestsObj = _.map(contests, c => {
                    let co   = c.toObject();
                    co.begin = moment(c.begin).format('LLL');
                    co.end   = moment(c.end).format('LLL');
                    return co;
                });
                new Promise((resolve, reject) => {
                    let result = [];
                    contests.forEach((c, i) => {
                        contestRepo.findOneByIdAndUser(c._id, req.user._id)
                            .then(uc => {
                                contestsObj[i].joined   = true;
                                contestsObj[i].score    = uc.score;
                                contestsObj[i].progress = uc.progress;
                                result.push(i);
                                if (result.length >= contests.length) {
                                    resolve(result);
                                }
                            })
                            .catch(err => {
                                result.push(i);
                                if (err.status !== 404) {
                                    return reject(err);
                                }
                                if (result.length >= contests.length) {
                                    resolve(result);
                                }
                            })
                    });
                }).then(() => {
                    res.locals.contests = contestsObj;
                    res.render('dashboard/index');
                }).catch(err => {
                    return next(err);
                });
            } else {
                res.locals.contests = [];
                res.render('dashboard/index');
            }
        })
        .catch(err => {
            next(err);
        });

});

module.exports = router;