let ensureAuthenticated = require('../utils/auth').ensureAuthenticated,
    accounts = require('./accounts'),
    workspaces = require('./workspaces'),
    contests = require('./contests'),
    problems = require('./problems');

module.exports = (app) => {
    [
        {
            key: '/accounts',
            value: accounts
        },
        {
            key: '/workspaces',
            value: workspaces
        },
        {
            key: '/contests',
            value: contests
        },
        {
            key: '/problems',
            value: problems
        }
    ].forEach(elem => app.use(`/sapi${elem.key}`, ensureAuthenticated, elem.value));
};