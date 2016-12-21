let home = require('./home'),
    users = require('./users'),
    contests = require('./contests'),
    status = require('./status');

module.exports = [
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
        key: '/status',
        value: status
    }
];