const GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete';

function noop(req, res) {
    return res.status(501).json({
        err: true,
        msg: `"${req.url}" is not implemented in the server`
    });
}

/**
 *
 * @param {string} url
 * @param {function} action
 * @param {string} [method]
 * @param {boolean} [protect]
 * @return {{protect: boolean, method: string, url: string, action: function}}
 */
function createRoute(url, action, method = GET, protect = true) {
    return {
        protect: protect,
        method: method,
        url: url,
        action: action
    }
}

module.exports = function (server) {
    let accounts = require('./accounts')(server),
        contests = require('./contests')(server),
        problems = require('./problems')(server);
    return [
        createRoute('/accounts/signup', accounts.signup, POST, false),
        createRoute('/accounts/logout', accounts.logout, POST),
        createRoute('/accounts/me', accounts.info),
        createRoute('/contests/all', contests.getAllContests, GET),
        createRoute('/contests/active', contests.getActiveContests, GET),
        createRoute('/contests', contests.getAllContestsByUser),
        createRoute('/contests/:contest', noop),
        createRoute('/contests/:contest/top10', noop),
        createRoute('/contests/:contest/problems', problems.getAllProblemsByContest),
        createRoute('/contests/:contest/problems/:problem', problems.getAllProblemByIdWithContest),
        createRoute('/contests/:contest/problems/:problem/solutions', noop),
        createRoute('/contests/:contest/problems/:problem/solutions', noop, POST),
        createRoute('/contests/:contest/problems/:problem/solutions/:solution', noop)
    ]
};