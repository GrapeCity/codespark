let home = require('./home'),
    users = require('./users'),
    contests = require('./contests'),
    problems = require('./problems'),
    status = require('./status'),
    basicAuth = require('../utils/basicAuth');

module.exports = (app, config) => {
    let protect = basicAuth(config.basicAuth.user, config.basicAuth.password);
    [
        {
            key: '/',
            value: home
        },
        {
            key: '/users',
            value: users
        },
        {
            key: '/contests',
            value: contests
        },
        {
            key: '/problems',
            value: problems
        },
        {
            key: '/status',
            value: status
        }
    ].forEach(elem => app.use(elem.key, protect, elem.value));
};