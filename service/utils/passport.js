let passport = require('passport'),
    crypto = require('crypto'),
    LocalStrategy = require('passport-local').Strategy,
    validator = require('validator'),
    UserRepository = require('../repositories/userRepository');

/**
 * Configure passport, add bearer strategy to verify access token.
 *
 * @param app
 */
module.exports = function (app) {
    let userRepo = new UserRepository();

    /**
     * LocalStrategy
     *
     * 此策略使用用户名和密码进行用户身份认证。
     * 当有请求发送到应用程序时，必须保证用户已经登录。
     */
    passport.use(new LocalStrategy({
            usernameField: 'mail',
            passwordField: 'password'
        },
        (mail, password, next) => {
            if (!validator.isEmail(mail)) {
                return next(null, false, {
                    msg: '邮箱不合法'
                });
            }

            userRepo.findOneByMail(mail.toLowerCase())
                .then(user => {
                    if (!user) {
                        return next(null, false, {
                            msg: '用户不存在'
                        });
                    }
                    if (!authenticate(user, password)) {
                        return next(null, false, {
                            msg: '密码错误'
                        });
                    }
                    return next(null, user);
                })
                .catch(err => {
                    return next(err);
                });
        }
    ));

    function authenticate(user, password) {
        if (user.salt && password) {
            return user.password === crypto.pbkdf2Sync(password,
                    new Buffer(user.salt, 'base64'),
                    10000, 64, 'sha1').toString('base64');
        } else {
            return user.password === password;
        }
    }

    /**
     * 注册序列化和反序列化函数
     * 当客户端重定向用户到授权节点时，一个授权认证的过程将开启，如果想要完成这个过程，用户必须进行身份认证并且接受授权请求
     * 因为整个授权认证过程将会有多个HTTPS的请求和响应进行数据交换，因此整个过程需要使用session进行存储记录。
     *
     * 应用程序必须提供序列化方法，用于确定怎样把客户端对象序列化到session中，通常只会简单的把客户ID保存到session中，同时通过提供的反序列化函数从session获取客户ID并从数据库中查找对应的客户数据。
     */

    /**
     * 注册序列化函数
     */
    passport.serializeUser((user, next) => next(null, user.id));

    /**
     * 注册反序列化函数
     */
    passport.deserializeUser((id, next) => {
        userRepo.findById(id, '-salt -password', true)
            .then(user => {
                if (!user) {
                    return next(null, false);
                }
                return next(null, user);
            })
            .catch(err => {
                return next(null, null);
            });
    });

    app.use(passport.initialize());
    app.use(passport.session());
};