var http = require('http'),
    config = require('../config'),
    validator = require('../utils/validator'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    UserRoles = mongoose.model('UserRoles'),
    logger = require('../utils/winston').appLogger;

/**
 * login the user to GrapeCity AD system
 * @param {string} mail the email, must be form like someone@grapecity.com
 * @param {string} password the secure password
 * @param {function(err, user)} done callback to notify login result
 */
function loginGrapeCityDomain(mail, password, done) {
    var timeoutHandler,
        req = http.request({
            host: config.adAuth.host,
            port: config.adAuth.port,
            path: config.adAuth.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, function (res) {
            // require accepted
            clearTimeout(timeoutHandler);

            timeoutHandler = setTimeout(function () {
                res.destroy();
                done(new Error("获取HTTP响应流超时"), null);
            }, 5000);
            var succeeded = (res.statusCode == 200);
            res.setEncoding('utf8');
            // all data must be less than 65535 strings
            var resBody = "";
            res.on('data', function (data) {
                resBody += data;
            });
            res.on('end', function () {
                // data ready
                clearTimeout(timeoutHandler);

                // process data
                var userInfo = null;
                if (succeeded) {
                    try {
                        userInfo = JSON.parse(resBody);
                        done(null, userInfo);
                    } catch (any) {
                        logger.warn('Response Error: ' + any)
                        done(any, userInfo);
                    }
                } else {
                    logger.info(resBody);
                    done(new Error(resBody), userInfo);
                }
            });
        });
    req.on('error', function (err) {
        clearTimeout(timeoutHandler);
        done(err, null);
    });
    req.write(JSON.stringify({mail: mail, password: password}));
    req.end();

    // performance: make sure require must be back in 5 seconds
    timeoutHandler = setTimeout(function () {
        req.abort();
    }, 5000);
}

/**
 *
 * @param mail
 * @param userName
 * @param displayName
 * @param done
 */
function createUser(mail, userName, displayName, done) {

}

module.exports = function (server) {

    function info(req, res) {
        if (!req.user) {
            return res.status(401).json({
                err: true,
                msg: '未登录或者未授权的访问'
            });
        }
        return res.json(req.body);
    }

    function login(req, res) {
        logger.debug(JSON.stringify(req.body));
        if (!req.body.mail || !validator.isEmail(req.body.mail)) {
            return res.status(400).json({
                err: true,
                msg: '用户邮箱为空或者不是合法邮箱',
                timestamp: new Date().getTime()
            });
        }

        return res.status(200).json(req.body);
    }

    function signup(req, res) {
        if (!req.body.mail || !validator.isEmail(req.body.mail)) {
            return res.status(400).json({
                err: true,
                msg: '用户邮箱为空或者不是合法邮箱',
                timestamp: new Date().getTime()
            });
        }

        User.findOne({mail: req.body.mail}, function (err, existedUser) {
            if (err) {
                logger.error(err);
                return res.status(500).json({
                    err: true,
                    msg: '内部错误导致注册失败，请联系管理员!',
                    timestamp: new Date().getTime()
                });
            }

            if (existedUser) {
                return res.status(400).json({
                    err: true,
                    msg: '该邮件已经被注册过',
                    timestamp: new Date().getTime()
                });
            }

            if (req.body.grapecity &&
                req.body.mail.slice(-14) === '@grapecity.com') {

                loginGrapeCityDomain(req.body.mail,
                    req.body.password,
                    function (err, userInfo) {
                        if (err) {
                            logger.error('Internal Error: ' + err);
                            return res.status(500).json({
                                err: true,
                                msg: '无法完成GrapeCity域验证，请和管理员联系',
                                timestamp: new Date().getTime()
                            });
                        }
                        if (!userInfo) {
                            return res.status(400).json({
                                err: true,
                                msg: '无法登陆用户（邮箱：' + req.body.mail + '）到GrapeCity域，请和管理员联系',
                                timestamp: new Date().getTime()
                            })
                        }

                        createUser(userInfo.mail,
                            userInfo.userName,
                            userInfo.displayName,
                            function (err, user) {

                            });
                    });
            } else { // normal sign up
                return res.status(200).json("signup with " + JSON.stringify(req.body));
            }
        });
    }

    return {
        login: login,
        signup: signup,
        info: info
    };
};