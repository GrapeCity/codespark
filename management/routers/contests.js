let express = require('express'),
    mongoose = require('mongoose'),
    querystring = require('querystring'),
    router = express.Router(),
    Contest = mongoose.model('Contest');

/* GET contests list. */
router.get('/', (req, res, next) => {

    let search = req.query.search,
        limit = parseInt(req.query.limit, 10) || 10,
        page = parseInt(req.query.page) || 0,
        skip = (parseInt(req.query.skip, 10) || 0) + limit * page;
    let q = Contest.find();
    if (search) {
        q = q.regex('displayName', `.*${search}.*`)
    }
    q.sort('name')
        .skip(skip)
        .limit(limit)
        .select('name displayName description begin end -_id')
        .exec((err, contests) => {
            if (err) {
                return next(err);
            }
            let prevUrl = querystring.stringify({
                search, page: page - 1, limit
            }), nextUrl = querystring.stringify({
                search, page: page - 1, limit
            });
            res.render('contests/index', {
                index: 3,
                title: 'Contests List',
                messages: [],
                contests: contests || [],
                form: {
                    search,
                    prev: {
                        enable: page > 0,
                        url: `/contests${ prevUrl ? '?' + prevUrl : '' }`
                    },
                    next: {
                        enable: contests.length >= limit,
                        url: `/contests${ nextUrl ? '?' + nextUrl : '' }`
                    }
                }
            });
        });
});

/* Get contest details */
router.get('/:name/', (req, res, next) => {
    Contest.findOne({name: req.params.name})
        .populate('problems')
        .exec((err, contest) => {
            if (err) {
                return next(err);
            }
            if (!contest) {
                return next();
            }
            res.render('contests/detail', {
                index: 3,
                title: 'Contest Details',
                messages: [],
                contest: contest,
                form: {}
            });
        });
});

router.get('/add', (req, res, next) => {
    res.render('contests/add', {
        index: 2,
        title: 'Create Contest',
        messages: [],
        form: {}
    });
});

router.post('/add', (req, res, next) => {
    res.send(`now create a new contest: ${JSON.stringify(req.body)}`);
});

router.get('/:name/edit', (req, res, next) => {
    res.send(`now edit: ${req.params.name}`);
});

router.post('/:name/edit', (req, res, next) => {
    res.send(`now edit: ${req.params.name}: ${JSON.stringify(req.body)}`);
});

router.get('/:name/remove', (req, res, next) => {
    res.send(`now remove: ${req.params.name}`);
});

router.post('/:name/remove', (req, res, next) => {
    res.send(`now remove: ${req.params.name}: ${JSON.stringify(req.body)}`);
});

module.exports = router;