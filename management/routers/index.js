let home = require('./home'),
    users = require('./users'),
    contests = require('./contests'),
    problems = require('./problems'),
    status = require('./status');

module.exports = (app) => {
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
    ].forEach(elem => app.use(elem.key, elem.value));
};