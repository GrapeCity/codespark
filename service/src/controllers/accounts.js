var http = require('http'),
    config = require('../config'),
    validator = require('../utils/validator'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    UserRoles = mongoose.model('UserRoles'),
    logger = require('../utils/winston').appLogger;


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
        return res.json(req.body);
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
                    msg: '注册失败，请联系管理员!',
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
        });

        if (req.body.grapecity) {
            var timeoutHandler,
                post = http.request({
                    host: config.adAuth.host,
                    port: config.adAuth.port,
                    path: config.adAuth.path,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }, function (xhr) {
                    // require accepted
                    clearTimeout(timeoutHandler);

                    timeoutHandler = setTimeout(function () {
                        xhr.destroy();
                    }, 5000);
                    var succeeded = (xhr.statusCode == 200);
                    xhr.setEncoding('utf8');
                    // all data must be less than 65535 strings
                    var resBody = "";
                    xhr.on('data', function (data) {
                        resBody += data;
                    });
                    xhr.on('end', function () {
                        // data ready
                        clearTimeout(timeoutHandler);

                        // process data
                        var userInfo = null;
                        if (succeeded) {
                            try {
                                userInfo = JSON.parse(resBody);
                            } catch (any) {
                                logger.warn('Response Error: ' + any)
                            }
                        } else {
                            logger.info(resBody);
                        }
                        if (!userInfo) {
                            logger.info('Cannot login to GrapeCity');
                            return res.status(400).json({
                                err: true,
                                msg: '无法登陆用户（邮箱：' + req.body.mail + '）到GrapeCity域，请和管理员联系',
                                timestamp: new Date().getTime()
                            })
                        }

                        // write user into database, and login this user
                        var user = new User();
                        user.username = userInfo.userName;
                        user.email = userInfo.mail;
                        user.display = userInfo.displayName;
                        // logger.info(JSON.stringify(userInfo));
                        return res.json(userInfo);
                    });
                });
            post.on('error', function (err) {
                clearTimeout(timeoutHandler);
                logger.error('Internal Error: ' + err);
                return res.status(500).json({
                    err: true,
                    msg: '不能连接GrapeCity域验证服务器，请和管理员联系',
                    timestamp: new Date().getTime()
                });
            });
            post.write(JSON.stringify(req.body));
            post.end();

            // performance: make sure require must be back in 5 seconds
            timeoutHandler = setTimeout(function () {
                post.abort();
            }, 5000);
        } else { // normal sign up
            return res.status(200).json("signup with " + JSON.stringify(req.body));
        }
    }

    return {
        login: login,
        signup: signup
    };
};