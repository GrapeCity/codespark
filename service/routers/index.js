let auth = require('../utils/auth'),
    home = require('./home'),
    contests = require('./contests'),
    problems = require('./problems'),
    dashboard = require('./dashboard');

module.exports = (app) => {
    app.use('/', home);
    app.use('/contests', auth.ensureAuthenticated, contests);
    app.use('/problems', auth.ensureAuthenticated, problems);
    app.use('/dashboard', auth.ensureAuthenticated, dashboard);
};