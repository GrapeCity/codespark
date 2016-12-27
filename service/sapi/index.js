let ensureAuthenticated = require('../utils/auth').ensureAuthenticated,
    accounts = require('./accounts');

module.exports = (app) => {
    [
        {
            key: '/accounts',
            value: accounts
        }
    ].forEach(elem => app.use(`/sapi${elem.key}`, ensureAuthenticated, elem.value));
};