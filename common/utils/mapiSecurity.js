let moment = require('moment'),
    allowedUser = process.env.MAPI_USER || 'mapi.user',
    passwordPrefix = process.env.MAPI_PASSWORD_PRE || 'GrapeCityContest',
    passwordPostfix = process.env.MAPI_PASSWORD_POST || '@!';

module.exports = {
    authorize: (user, password) => {
        if (allowedUser !== user) {
            return false;
        }
        let now = moment(),
            realPassword = `${passwordPrefix}${now.format('YYYYMMDD')}${passwordPostfix}`;
        return realPassword === password;
    },
    accessToken: () => {
        let now = moment(),
            realPassword = `${passwordPrefix}${now.format('YYYYMMDD')}${passwordPostfix}`;
        return new Buffer(`${allowedUser}:${realPassword}`).toString('base64');
    }
};