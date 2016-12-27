let ensureAuthenticated = require('../utils/auth').ensureAuthenticated,
    accounts = require('./accounts'),
    contests = require('./contests');

module.exports = (app) => {
    app.use('/sapi/contests/active', contests.getActive);
    app.use('/sapi/contests/all', contests.getAll);
    [
        {
            key: '/accounts',
            value: accounts
        },
        {
            key: '/contests',
            value: contests
        }
    ].forEach(elem => app.use(`/sapi${elem.key}`, ensureAuthenticated, elem.value));
};