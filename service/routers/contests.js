let express = require('express'),
    utils = require('../utils'),
    logger = utils.winston.appLogger,
    router = express.Router(),
    ContestRepository = require('../repositories/contestRepository');

router.get('/:name', (req, res, next) => {
    let name = req.params.name,
        contestRepo = new ContestRepository();

    contestRepo.findOneByNameWithUser(name, req.user._id)
        .then(data => {
            return res.render('contest/index', {
                validation: [],
                form: data
            });
        })
        .catch(err => {
            if (err.status === 404) {
                return res.render('contest/index', {
                    validation: [
                        `竞赛（${name}）不存在，或者你没有加入该竞赛`
                    ]
                });
            }
            next(err);
        });
});

module.exports = router;