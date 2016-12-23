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
                search, page: page + 1, limit
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
        index: 3,
        title: 'Create Contest',
        messages: [],
        form: {}
    });
});

router.post('/add', (req, res, next) => {
    //{"name":"GC2017Spring","displayName":"2017年新春编程挑战赛","start":"2016/12/23","end":"2017/01/20","open":"on"}
    let {name, displayName, open, start, end} = req.body,
        validation = [];
    if(!name){
        validation.push({msg: 'name must be provided'});
    }
    if(!displayName) {
        validation.push({msg: 'displayName must be provided'});
    }
    if(!start) {
        validation.push({msg: 'start must be provided'});
    }
    if(!end) {
        validation.push({msg: 'end must be provided'});
    }
    if(validation.length > 0){
        res.render('contests/add', {
            index: 3,
            title: 'Create Contest',
            messages: [],
            validation: validation,
            form: req.body
        });
    }
    Contest.findOne({name: name}, (err, existed) => {

    });
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