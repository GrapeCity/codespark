let home = require('./home'),
    dashboard = require('./dashboard'),
    users = require('./users');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

module.exports = (app) => {
    app.use('/', home);
    app.use('/dashboard', ensureAuthenticated, dashboard);
    app.use('/users', ensureAuthenticated, users);
};