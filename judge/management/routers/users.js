let express = require('express'),
    mongoose = require('mongoose'),
    router = express.Router(),
    User = mongoose.model('User');

/**
 * show the users lists
 */
/* GET users */
router.get('/', (req, res, next) => {
    User.find()
        .select('mail username displayName profileImageURL created activated activeToken')
        .exec((err, users) => {
            if (err) {
                return next(err);
            }

            res.render('users/index', {
                index: 2,
                users: users || [],
                title: 'Manage Users'
            });
        });

});

/**
 * create a new user
 */
/* POST users*/
router.post('/', (req, res, next) => {

});

module.exports = router;