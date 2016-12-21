let home = require('./home'),
    users = require('./users'),
    users_api = require('./mapi/users'),
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
    },
    {
        key: '/mapi/users',
        value: users_api
    }
];