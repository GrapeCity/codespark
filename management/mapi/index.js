let _ = require('lodash'),
    moment = require('moment'),
    allowedUsers = (process.env.MAPI_USERS || 'mapi.admin' ).split(',').map(u => u.trim()),
    passwordPrefix = process.env.MAPI_PASSWORD_PRE || 'gC',
    passwordPostfix = process.env.MAPI_PASSWORD_POST || '';
let basicAuth = require('../utils/basicAuth')((user, password, next) => {
    if (!_.find(allowedUsers, (au) => au === user)) {
        return next(new Error(`${user} is not found`));
    }
    let now = moment(),
        realPassword = `${passwordPrefix}${now.format('YYYYMMdd')}${passwordPostfix}`;
    if (realPassword !== password) {
        return next(new Error(`user name or password is not matched`));
    }
    next(null, {name: user});
}, 'Authorization Required for Management API');

module.exports = (app) => {
    [
        {
            key: '',
            value: (req, res) => res.status(404).json({err: true, msg: 'iterating api list is not supported'})
        },
    ].forEach(elem => app.use(`/mapi${elem.key}`, basicAuth, elem.value));
};