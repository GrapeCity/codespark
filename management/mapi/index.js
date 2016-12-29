let express = require('express'),
    _ = require('lodash'),
    mapiSecurity = require('../utils').mapiSecurity,
    users = require('./users'),
    judge = require('./judge');

let basicAuth = require('../utils/basicAuth')((user, password, next) => {
    if (!mapiSecurity.authorize(user, password)) {
        return next(new Error(`user name or password is not matched`));
    }
    next(null, {name: user});
}, 'Authorization Required for Management API');

module.exports = (app, config) => {
    judge.setup(config);
    [
        {
            key: '/users',
            value: users
        },
        {
            key: '/judge',
            value: judge
        },
        // {
        //     key: '/problems',
        //     value: problems
        // },
        /* all supported mapi must be placed before error fallback */
        {
            key: '',
            value: (req, res, next) => res.status(404).json({
                err: true,
                msg: `api "${req.url}" is not found or iterating is not supported`
            })
        },
    ].forEach(elem => app.use(`/mapi${elem.key}`, basicAuth, elem.value));
};