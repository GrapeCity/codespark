let accounts = require('./accounts');

module.exports = (app) => {
    [
        {
            key: '/accounts',
            value: accounts.router
        }
    ].forEach(elem => app.use(`/sapi${elem.key}`, accounts.ensureAuthenticated, elem.value));
};