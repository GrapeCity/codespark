var GET = 'get',
    POST='post',
    PUT='put',
    DELETE='delete';

/**
 *
 * @param {string} url
 * @param {function} action
 * @param {string} [method]
 * @param {boolean} [protect]
 * @return {{protect: boolean, method: string, url: string, action: function}}
 */
function createRoute(url, action, method, protect){
    if (typeof(method)==='undefined') method = GET;
    if (typeof(protect)==='undefined') protect = true;
    return {
        protect: protect,
        method: method,
        url: url,
        action: action
    }
}

module.exports = function (server) {
    var accounts = require('./accounts')(server);
    return [
        createRoute('/accounts/info', accounts.info),
        createRoute('/accounts/signup', accounts.signup, POST, false)
    ]
};