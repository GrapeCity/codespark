let express = require('express'),
    querystring = require('querystring'),
    _ = require('lodash'),
    moment = require('moment'),
    utils = require('../utils'),
    mongoose = utils.mongoose,
    logger = utils.winston.appLogger,
    router = express.Router(),
    Contest = mongoose.model('Contest'),
    Problem = mongoose.model('Problem');


function formatContest(contest) {
    return {
        name: contest.name,
        displayName: contest.displayName,
        open: contest.open,
        description: contest.description,
        begin: moment(contest.begin).format('YYYY/MM/DD HH:mm:ss'),
        end: moment(contest.end).format('YYYY/MM/DD HH:mm:ss')
    };
}

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
        .select('name displayName open description begin end -_id')
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
                contests: _.map(contests || [], formatContest),
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
                contest: formatContest(contest),
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
    let {name, displayName, open, begin, end} = req.body,
        validation = [];
    if (!name) {
        validation.push({msg: 'name must be provided'});
    }
    if (!displayName) {
        validation.push({msg: 'displayName must be provided'});
    }
    if (!begin || !(begin = moment(begin, 'YYYY/MM/DD HH:mm:ss').toDate())) {
        validation.push({msg: 'begin must be provided'});
    }
    if (!end || !(end = moment(end, 'YYYY/MM/DD HH:mm:ss').toDate())) {
        validation.push({msg: 'end must be provided'});
    }
    if (validation.length > 0) {
        return res.render('contests/add', {
            index: 3,
            title: 'Create Contest',
            messages: [],
            validation: validation,
            form: req.body
        });
    }
    Contest.findOne({name}, (err, existed) => {
        if (err) {
            return next(err);
        }
        if (existed) {
            return res.render('contests/add', {
                index: 3,
                title: 'Create Contest',
                messages: [],
                validation: [{msg: `Contest with ${name} is already existed`}],
                form: req.body
            });
        }
        let one = new Contest({name, displayName, open, begin, end});
        one.save((err) => {
            if (err) {
                return next(err);
            }
            return res.redirect(`/contests/${name}`);
        });
    });
});


router.get('/:name/edit', (req, res, next) => {
    Contest.findOne({name: req.params.name})
        .populate('problems')
        .exec((err, contest) => {
            if (err) {
                return next(err);
            }
            if (!contest) {
                return next(); //make a 404
            }

            Problem.find()
                .nin('name', contest.problems.map(p => p.name))
                .exec((err, aps) => {
                    let available = [];
                    if (!err && aps && aps.length > 0) {
                        available = aps.map(ap => ({
                            _id: ap._id,
                            name: ap.name,
                            title: ap.title
                        }))
                    }
                    res.render('contests/edit', {
                        index: 3,
                        title: 'Edit Contest',
                        messages: [],
                        form: formatContest(contest),
                        problems: available
                    });
                });
        });
});

router.post('/:name/edit', (req, res, next) => {
    let {_id, name} = req.body,
        validation = [];
    if (!_id) {
        validation.push({
            msg: 'missing contest id to operated'
        });
    }
    new Promise((resolve, reject) => {
        if (name !== req.params.name) {
            Contest.find({name: req.body.name}, (err, existed) => {
                if (err) {
                    return reject(err);
                }
                if (existed && existed.length > 0) {
                    validation.push({msg: `There is already exist a contest named "${req.body.name}"`});
                    return resolve(false);
                }
                resolve(true);
            });
        } else {
            resolve(true);
        }
    }).then(ok => {
        if (validation.length > 0) {
            return Contest.findOne({name: req.params.name})
                .populate('problems')
                .exec((err, contest) => {
                    if (err) {
                        return next(err);
                    }
                    if (!contest) {
                        return next(); //make a 404
                    }
                    res.render('contests/edit', {
                        index: 3,
                        title: 'Edit Contest',
                        messages: [],
                        validation: validation,
                        form: formatContest(contest)
                    });
                });
        }
        let update = {};
        ['name', 'displayName', 'begin', 'end', 'description'].forEach(p => {
            if (req.body[p]) {
                update[p] = req.body[p];
            }
        });
        update.open = req.body.open;
        Contest.findByIdAndUpdate(_id, update, {new: true})
            .populate('problems')
            .exec((err, contest) => {
                if (err) {
                    return next(err);
                }
                if (!contest) {
                    return next();
                }
                res.render('contests/edit', {
                    index: 3,
                    title: 'Edit Contest',
                    messages: [{
                        msg: `contest "${contest.name}" have been updated`
                    }],
                    form: formatContest(contest)
                });
            });
    }).catch(err => {
        next(err);
    });
});


router.get('/:name/remove', (req, res, next) => {
    let name = req.params.name;
    Contest.findOne({name}, (err, contest) => {
        if (err) {
            return next(err);
        }
        if (!contest) {
            return next();
        }
        res.render('contests/remove', {
            index: 3,
            title: 'Delete Contest',
            messages: [],
            form: contest
        });
    });
});

router.post('/:name/remove', (req, res, next) => {
    let name = req.params.name,
        _id = req.body._id,
        nameVerify = req.body.name,
        validation = [];
    if (!_id) {
        validation.push({
            msg: 'missing contest id to operated'
        });
    }
    if (!nameVerify || name !== nameVerify) {
        validation.push({
            msg: 'mismatch confirmed contest name'
        });
    }
    if (validation.length > 0) {
        return Contest.findOne({name}, (err, contest) => {
            if (err) {
                return next(err);
            }
            if (!contest) {
                return next();
            }
            res.render('contests/remove', {
                index: 3,
                title: 'Delete Contest',
                messages: [],
                validation: validation,
                form: contest
            });
        });
    }
    Contest.findByIdAndRemove(_id, (err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/contests');
    });
});

module.exports = router;