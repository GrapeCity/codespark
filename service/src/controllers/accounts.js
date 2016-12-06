var http = require('http'),
    config = require('../config'),
    validator = require('../utils/validator'),
    logger = require('../utils/winston').appLogger;


module.exports = function (server) {

    function login(req, res) {
        return res.json("login with " + JSON.stringify(req.body));
    }

    function signup(req, res) {
        if (!req.body) {
            return res.status(400).json({
                err: true,
                msg: '请求数据为空'
            });
        }
        if (!req.body.mail || !validator.isEmail(req.body.mail)) {
            return res.status(400).json({
                err: true,
                msg: '用户邮箱为空或者不是合法邮箱'
            });
        }
        if (req.body.grapecity) {
            var post = http.request({
                host: config.adAuth.host,
                port: config.adAuth.port,
                path: config.adAuth.path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }, function (xhr) {
                var succeeded = (xhr.statusCode == 200);
                xhr.setEncoding('utf8');
                // all data must be less than 65535 strings
                var resBody = "";
                xhr.on('data', function (data) {
                    resBody += data;
                });
                xhr.on('end', function () {
                    var userInfo = null;
                    if (succeeded) {
                        try {
                            userInfo = JSON.parse(resBody);
                        } catch (any){
                            logger.warn('Response Error: ' + any)
                        }
                    } else {
                        logger.info(resBody);
                    }
                    if (!userInfo) {
                        return res.status(400).json({
                            err: true,
                            msg: '无法登陆用户（邮箱：' + req.body.mail + '）到GrapeCity域，请和管理员联系'
                        })
                    }

                    // write user into database, and login this user
                    // logger.info(JSON.stringify(userInfo));
                    return res.json(userInfo);
                });
            });
            post.on('error', function (err) {
                logger.error('Internal Error: ' + err);
                return res.status(500).json({
                    err: true,
                    msg: '不能连接GrapeCity域验证服务器，请和管理员联系'
                });
            });
            post.write(JSON.stringify(req.body));
            post.end();
        } else { // normal sign up
            return res.status(200).json("signup with " + JSON.stringify(req.body));
        }
    }

    return {
        login: login,
        signup: signup
    };
};