let express = require('express'),
    querystring = require('querystring'),
    utils = require('../utils'),
    mongoose = utils.mongoose,
    logger = utils.winston.appLogger,
    router = express.Router(),
    Problem = mongoose.model('Problem');

/* GET problems page. */
router.get('/', function (req, res, next) {
    let search = req.query.search,
        limit = parseInt(req.query.limit, 10) || 10,
        page = parseInt(req.query.page) || 0,
        skip = (parseInt(req.query.skip, 10) || 0) + limit * page;
    let q = Problem.find();
    if (search) {
        q = q.regex('title', `.*${search}.*`)
    }
    q.sort('name')
        .skip(skip)
        .limit(limit)
        .select('name title description cases -_id')
        .exec((err, problems) => {
            if (err) {
                return next(err);
            }
            let prevUrl = querystring.stringify({
                search, page: page - 1, limit
            }), nextUrl = querystring.stringify({
                search, page: page + 1, limit
            });
            res.render('problems/index', {
                index: 4,
                title: 'Problems List',
                messages: [],
                problems: problems || [],
                form: {
                    search,
                    prev: {
                        enable: page > 0,
                        url: `/problems${ prevUrl ? '?' + prevUrl : '' }`
                    },
                    next: {
                        enable: problems.length >= limit,
                        url: `/problems${ nextUrl ? '?' + nextUrl : '' }`
                    }
                }
            });
        });
});

module.exports = router;