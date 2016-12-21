let http = require('http');

module.exports = function basicAuth(callback, realm) {
    let username, password;

    // user / pass strings
    if ('string' == typeof callback) {
        username = callback;
        password = realm;
        if ('string' != typeof password) {
            throw new Error('password argument required');
        }
        realm = arguments[2];
        callback = (user, pass) => user == username && pass == password
    }

    realm = realm || 'Authorization Required';

    return function (req, res, next) {
        let authorization = req.headers.authorization;

        if (req.user) {
            return next();
        }
        if (!authorization) {
            return unauthorized(res, realm);
        }

        let parts = authorization.split(' ');

        if (parts.length !== 2) {
            return next(error(400));
        }

        let scheme = parts[0]
            , credentials = new Buffer(parts[1], 'base64').toString()
            , index = credentials.indexOf(':');

        if ('Basic' != scheme || index < 0) {
            return next(error(400));
        }

        let user = credentials.slice(0, index)
            , pass = credentials.slice(index + 1);

        // async
        if (callback.length >= 3) {
            callback(user, pass, (err, user) => {
                if (err || !user) {
                    return unauthorized(res, realm);
                }
                req.user = req.remoteUser = user;
                next();
            });
            // sync
        } else {
            if (callback(user, pass)) {
                req.user = req.remoteUser = user;
                next();
            } else {
                unauthorized(res, realm);
            }
        }
    }
};

/**
 * Respond with 401 "Unauthorized".
 *
 * @param {ServerResponse} res
 * @param {String} realm
 * @api private
 */

function unauthorized(res, realm) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="' + realm + '"');
    res.end('Unauthorized');
}

/**
 * Generate an `Error` from the given status `code`
 * and optional `msg`.
 *
 * @param {Number} code
 * @param {String} msg
 * @return {Error}
 * @api private
 */

function error(code, msg = null) {
    let err = new Error(msg || http.STATUS_CODES[code]);
    err.status = code;
    return err;
}