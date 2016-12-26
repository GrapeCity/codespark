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

router.get('/:name/', (req, res, next) => {
    Problem.findOne({name: req.params.name})
        .exec((err, problem) => {
            if (err) {
                return next(err);
            }
            if (!problem) {
                return next();
            }
            res.render('problems/detail', {
                index: 4,
                title: 'Problem Details',
                messages: [],
                problem: problem,
                form: {}
            });
        });
});

router.get('/add', (req, res, next) => {
    res.render('problems/add', {
        index: 4,
        title: 'Create Problem',
        messages: [],
        form: {}
    });
});

router.post('/add', (req, res, next) => {
    let {name, title, description, cases} = req.body,
        validation = [];
    if (!name) {
        validation.push({msg: 'name must be provided'});
    }
    if (!title) {
        validation.push({msg: 'title must be provided'});
    }
    if (!description) {
        validation.push({msg: 'description must be provided'});
    }
    if (validation.length > 0) {
        return res.render('problems/add', {
            index: 4,
            title: 'Create Problem',
            messages: [],
            validation: validation,
            form: req.body
        });
    }
    Problem.findOne({name}, (err, existed) => {
        if (err) {
            return next(err);
        }
        if (existed) {
            return res.render('problems/add', {
                index: 4,
                title: 'Create Problem',
                messages: [],
                validation: [{msg: `Problem with ${name} is already existed`}],
                form: req.body
            });
        }
        let one = new Problem({name, title, description, cases});
        one.save(err => {
            if (err) {
                return next(err);
            }
            return res.redirect(`/problems/${name}`);
        });
    });
});


router.get('/:name/edit', (req, res, next) => {
    Problem.findOne({name: req.params.name})
        .exec((err, problem) => {
            if (err) {
                return next(err);
            }
            if (!problem) {
                return next(); //make a 404
            }
            res.render('problems/edit', {
                index: 4,
                title: 'Edit Problem',
                messages: [],
                form: problem
            });
        });
});

router.post('/:name/edit', (req, res, next) => {
    let {_id, name} = req.body,
        validation = [];
    if (!_id) {
        validation.push({
            msg: 'missing problem id to operated'
        });
    }
    new Promise((resolve, reject) => {
        if (name !== req.params.name) {
            Problem.find({name: req.body.name}, (err, existed) => {
                if (err) {
                    return reject(err);
                }
                if (existed && existed.length > 0) {
                    validation.push({msg: `There is already exist a problem named "${req.body.name}"`});
                    return resolve(false);
                }
                resolve(true);
            });
        } else {
            resolve(true);
        }
    }).then(ok => {
        if (validation.length > 0) {
            return Problem.findOne({name: req.params.name})
                .exec((err, problem) => {
                    if (err) {
                        return next(err);
                    }
                    if (!problem) {
                        return next(); //make a 404
                    }
                    res.render('problems/edit', {
                        index: 4,
                        title: 'Edit Problem',
                        messages: [],
                        validation: validation,
                        form: problem
                    });
                });
        }
        let update = {};
        ['name', 'title', 'description', 'cases'].forEach(p => {
            if (req.body[p]) {
                update[p] = req.body[p];
            }
        });
        Problem.findByIdAndUpdate(_id, update, {new: true})
            .exec((err, problem) => {
                if (err) {
                    return next(err);
                }
                if (!problem) {
                    return next();
                }
                res.render('problems/edit', {
                    index: 4,
                    title: 'Edit Problem',
                    messages: [{
                        msg: `problem "${problem.name}" have been updated`
                    }],
                    form: problem
                });
            });
    }).catch(err => {
        next(err);
    });
});


router.get('/:name/remove', (req, res, next) => {
    let name = req.params.name;
    Problem.findOne({name}, (err, problem) => {
        if (err) {
            return next(err);
        }
        if (!problem) {
            return next();
        }
        res.render('problems/remove', {
            index: 4,
            title: 'Delete Problem',
            messages: [],
            form: problem
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
            msg: 'missing problem id to operated'
        });
    }
    if (!nameVerify || name !== nameVerify) {
        validation.push({
            msg: 'mismatch confirmed problem name'
        });
    }
    if (validation.length > 0) {
        return Problem.findOne({name}, (err, problem) => {
            if (err) {
                return next(err);
            }
            if (!problem) {
                return next();
            }
            res.render('problems/remove', {
                index: 4,
                title: 'Delete Problem',
                messages: [],
                validation: validation,
                form: problem
            });
        });
    }
    Problem.findByIdAndRemove(_id, (err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/problems');
    });
});

module.exports = router;