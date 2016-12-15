var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    mongoose = require('mongoose'),
    validator = require('./validator'),
    User = mongoose.model('User');

/**
 * Configure passport, add bearer strategy to verify access token.
 *
 * @param app
 */
module.exports = function (app) {
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
        function (mail, password, done) {
            if (!validator.isEmail(mail)) {
                return done(null, false, {msg: '邮箱不合法'});
            }
            var queryParam = {mail: mail.toLowerCase()};
            User.findOne(queryParam, function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false, {msg: '用户不存在'});
                }
                if (!user.authenticate(password)) {
                    return done(null, false, {msg: '密码错误'});
                }
                return done(null, user);
            });
        }
    ));

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
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    /**
     * 注册反序列化函数
     */
    passport.deserializeUser(function (id, done) {
        User.findById(id, '-salt -password', function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false);
            }
            return done(null, user);
        });
    });

    app.use(passport.initialize());
    app.use(passport.session());
};