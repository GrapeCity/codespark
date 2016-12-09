var GET = 'get',
    POST='post',
    PUT='put',
    DELETE='delete';

module.exports = function (server) {
    var accounts = require('./accounts')(server);
    return [
        {
            method: GET,
            url: '/accounts/info',
            action: accounts.info
        },
        {
            method: POST,
            url: '/accounts/login',
            action: accounts.login
        },
        {
            method: POST,
            url: '/accounts/signup',
            action: accounts.signup
        }
    ]
};