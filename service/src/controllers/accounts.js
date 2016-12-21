let http = require('http'),
    crypto = require('crypto'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    _ = require('lodash'),
    redisCache = require('./../utils/redisCache'),
    config = require('../config'),
    validator = require('../utils/validator'),
    logger = require('../utils/winston').appLogger,
    User = mongoose.model('User'),
    UserContests = mongoose.model('UserContests');

/**
 * login the user to GrapeCity AD system
 * @param {string} mail the email, must be form like someone@grapecity.com
 * @param {string} password the secure password
 * @param {function(Error, user)} done callback to notify login result
 */
function loginGrapeCityDomain(mail, password, done) {
    let timeoutHandler,
        req = http.request({
            host: config.adAuth.host,
            port: config.adAuth.port,
            path: config.adAuth.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, res => {
            // require accepted
            clearTimeout(timeoutHandler);

            timeoutHandler = setTimeout(function () {
                res.destroy();
                done(new Error("获取HTTP响应流超时"), null);
            }, 5000);
            let succeeded = (res.statusCode == 200);
            res.setEncoding('utf8');
            // all data must be less than 65535 strings
            let resBody = "";
            res.on('data', data => {
                resBody += data;
            });
            res.on('end', () => {
                // data ready
                clearTimeout(timeoutHandler);

                // process data
                let userInfo = null;
                if (succeeded) {
                    try {
                        userInfo = JSON.parse(resBody);
                        userInfo.grapecity = true;
                        done(null, userInfo);
                    } catch (any) {
                        done(any, userInfo);
                    }
                } else {
                    done(new Error(resBody), userInfo);
                }
            });
        });
    req.on('error', err => {
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
 * create a new user into contest system
 * @param {string} mail user identity, unique
 * @param {string} password user password, will hash by pbkdf2 10000 times
 * @param username
 * @param displayName
 * @param gcUser
 * @param done
 */
function createUser(mail, password, username, displayName, gcUser, done) {
    let user = new User({
        provider: 'local',
        mail: mail,
        password: password,
        username: username,
        displayName: displayName,
        activated: gcUser,
        activeToken: crypto.randomBytes(12).toString('base64'), // 16 characters
        activeExpires: new Date(new Date().getTime() + (2 * 24 * 60 * 60 * 1000)) // two days
    });
    user.save(function (err) {
        if (err) {
            done(err);
        }
        if (!gcUser) {
            // send mail
        }
        done(null, user);
    })
}

module.exports = function (server) {

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.status(401).json({
            err: true,
            msg: '未登录或者未授权的访问'
        });
    }

    function info(req, res) {
        let user = req.user,
            cache = redisCache(server);

        cache.getCache(`user:${user._id}`, (next) => {
            console.log('no cache, hit original fetch');
            UserContests.find({user: user._id})
                .populate('contest')
                .exec((err, ucs) => {
                    next(err, {
                        mail: user.mail,
                        username: user.username,
                        displayName: user.displayName,
                        profileImageURL: user.profileImageURL,
                        activated: user.activated,
                        contests: ucs && _.map(ucs, uc => uc.contest)
                    });
                });
        }).then(data => res.status(200).json({
            mail: data.mail,
            username: data.username,
            displayName: data.displayName,
            profileImageURL: data.profileImageURL,
            activated: data.activated,
            contests: data.contest
        }));
    }

    function info2(req, res) {
        let user = req.user;
        UserContests.find({user: user._id})
            .populate('contest')
            .exec((err, ucs) => {
                if (err) {
                    logger.error(`Read data from mongodb error: ${err}`);
                    return res.status(500).json({
                        err: true,
                        msg: '读取用户元数据出错！'
                    });
                }
                res.status(200).json({
                    mail: user.mail,
                    username: user.username,
                    displayName: user.displayName,
                    profileImageURL: user.profileImageURL,
                    activated: user.activated,
                    contests: ucs && _.map(ucs, uc => uc.contest)
                });
            });
    }

    function info3(req, res) {
        var UserRepository = require('../repositories/userRepository'),
            userRep = new UserRepository(server);
        userRep.readById(req.user._id, true)
            .then((user) => res.status(200).json(user))
            .catch((err) => {
                logger.error(`Read data from mongodb error: ${err}`);
                res.status(500).json({
                    err: true,
                    msg: '读取用户元数据出错！'
                })
            });
    }

    function login(req, res) {
        let user = req.user;
        if (!user) {
            return res.status(401).json({
                err: true,
                msg: '用户名或者密码错误，请稍后重试！'
            });
        }
        if (!user.activated) {
            return res.status(400).json({
                err: true,
                msg: '该用户未激活，请检查注册时使用的邮箱，并使用其中的激活链接激活注册用户',
                timestamp: new Date().getTime()
            });
        }

        return res.status(200).json({
            mail: user.mail,
            username: user.username,
            displayName: user.displayName,
            activated: user.activated
        });
    }

    function logout(req, res) {
        req.session.destroy();
        req.logOut();
        return res.status(200);
    }

    function signup(req, res) {
        if (!req.body.mail || !validator.isEmail(req.body.mail)) {
            return res.status(400).json({
                err: true,
                msg: '用户邮箱为空或者不是合法邮箱',
                timestamp: new Date().getTime()
            });
        }

        User.findOne({mail: req.body.mail}, (err, existedUser) => {
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

            if (req.body.grapecity ||
                req.body.mail.slice(-14) === '@grapecity.com') {

                loginGrapeCityDomain(req.body.mail,
                    req.body.password,
                    (err, userInfo) => {
                        if (err) {
                            logger.error(`Internal Error: ${err}`);
                            return res.status(500).json({
                                err: true,
                                msg: '无法完成GrapeCity域验证，请和管理员联系',
                                timestamp: new Date().getTime()
                            });
                        }
                        if (!userInfo) {
                            return res.status(400).json({
                                err: true,
                                msg: `无法登陆用户（邮箱：${req.body.mail}）到GrapeCity域，请和管理员联系`,
                                timestamp: new Date().getTime()
                            });
                        }

                        createUser(userInfo.mail,
                            req.body.password,
                            userInfo.userName,
                            userInfo.displayName,
                            true,
                            (err, user) => {
                                if (err) {
                                    return res.status(400).json({
                                        err: true,
                                        msg: '无法登陆用户（邮箱：' + req.body.mail + '）到GrapeCity域，请和管理员联系',
                                        timestamp: new Date().getTime()
                                    });
                                }
                                passport.authenticate('local')(req, res,
                                    () => res.status(201).json({
                                        mail: user.mail,
                                        username: user.username,
                                        displayName: user.displayName,
                                        activated: true
                                    }));
                            });
                    });
            } else { // normal sign up
                let username = req.body.username || req.body.mail.substr(0, req.body.mail.indexOf('@')).replace('.', '');
                let displayName = req.body.displayName || username;
                createUser(req.body.mail,
                    req.body.password,
                    username,
                    displayName,
                    false,
                    (err, user) => {
                        if (err) {
                            return res.status(400).json({
                                err: true,
                                msg: '无法登陆用户（邮箱：' + req.body.mail + '）到GrapeCity域，请和管理员联系',
                                timestamp: new Date().getTime()
                            });
                        }
                        passport.authenticate('local')(req, res,
                            () => res.status(201).json({
                                mail: user.mail,
                                username: user.username,
                                displayName: user.displayName,
                                activated: true
                            }));
                    });
            }
        });
    }

    return {
        protect: ensureAuthenticated,
        login: login,
        logout: logout,
        signup: signup,
        info: info,
        info2: info2,
        info3: info3
    };
};