let express           = require('express'),
    _                 = require('lodash'),
    utils             = require('../utils'),
    logger            = utils.winston.appLogger,
    router            = express.Router(),
    ContestRepository = require('../repositories/contestRepository');

router.get('/', (req, res, next) => {
    let contestRepo = new ContestRepository();
    contestRepo.findActiveContest(req.user.mail.slice(-14) !== '@grapecity.com')
        .then(contests => {
            res.locals.validation = [];
            res.locals.form       = {};
            if (contests && contests.length > 0) {
                new Promise((resolve, reject) => {
                    let result = [];
                    contests.forEach((c, i) => {
                        contestRepo.findOneByIdAndUser(c._id, req.user._id)
                            .then(uc => {
                                contests[i].score    = uc.score;
                                contests[i].progress = uc.progress;
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
                    res.locals.contests = contests;
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