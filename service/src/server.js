/**
 * Load module dependencies
 */
var express = require('express'),
    _ = require('lodash'),
    config = require('./config'),
    logger = require('./utils/winston').appLogger;

/**
 * Create an instance which wraps current application, and manage all inner resources
 * @param app
 * @constructor
 */
function Server(app) {
    this.app = app;
    this.resMgr = {
        /**
         * Get the resource instance by the key
         * @param key the global unique key for the resource instance
         * @return {Object} the resource instance if existed, otherwise undefined
         */
        get: function (key) {
            return (_.find(this._inner, function (i) {
                return i.key === key;
            }) || {}).instance;
        },
        /**
         * Add the managed resource to queue
         * @param {String} key the key to indicate resource globally
         * @param {Object} instance the resource to be managed
         * @param {Function} closeHandler the resource dispose handler function
         */
        add: function (key, instance, closeHandler) {
            this._inner = this._inner || [];
            this._inner.push({
                key: key,
                instance: instance,
                close: closeHandler
            })
        },
        /**
         * remove resource instance by key
         * @param {String} key
         */
        remove: function (key) {
            var removed = _.remove(this._inner, function (i) {
                return i.key === key;
            });
            if (removed) {
                _.each(removed, function (v) {
                    v.close();
                });
            }
        },
        /**
         * Dispose all managed resources
         */
        close: function () {
            var inner = this._inner;
            if (!inner || inner.length <= 0) {
                return;
            }
            while (this._inner.length > 0) {
                var item = this._inner.pop();
                if (item.close) {
                    item.close.call(item.instance);
                }
            }
        }
    }
}
Server.prototype = {
    setupMiddlewares: function () {
        var app = this.app,
            morgan = require('morgan'),
            RateLimit = require('express-rate-limit'),
            RateRedisStore = require('rate-limit-redis'),
            bodyParser = require('body-parser'),
            cookieParser = require('cookie-parser'),
            stream = require('./utils/winston').stream;

        // Showing stack errors
        app.set('showStackError', true);
        app.set('trust proxy', true);

        // Logging with Morgan and winston(https://github.com/expressjs/morgan) format
        // for morgan can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
        // app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
        //     stream: stream
        // }));
        app.use(morgan('combined', {
            stream: stream
        }));

        if(process.env.NODE_ENV === 'development'){
            var path = require('path');
            app.use(express.static(path.resolve(process.cwd(), '../site')));
        }

        // limit api access rating

        //  apply to all accounts requests
        var apiLimit = new RateLimit({
            windowMs: 60 * 1000, // 1 minutes
            max: 60, // limit each IP to 100 requests per windowMs
            delayMs: 0, // disable delaying - full speed until the max limit is reached
            store: new RateRedisStore({
                client: require('./utils/redis')(this)
            }),
            message: "当前IP尝试访问API次数过多，请1分钟后重试"
        });
        app.use(apiLimit);

        // Request body parsing middleware should be above methodOverride
        app.use(bodyParser.urlencoded({limit: '5mb', extended: true}));
        app.use(bodyParser.json({limit: '5mb'}));

        // Add the cookie parser and flash middleware
        app.use(cookieParser());
    },
    setupSession: function () {
        var app = this.app,
            session = require('express-session'),
            RedisStore = require('connect-redis')(session),
            sessionStorage = new RedisStore({
                client: require('./utils/redis')(this)
            });

        if (!sessionStorage) {
            var MemoryStore = session.MemoryStore;
            sessionStorage = new MemoryStore();
            logger.warn('Fallback : Using MemoryStore for the Session.');
        }

        app.use(session({
            saveUninitialized: true,
            resave: true,
            secret: config.session.secret,
            store: sessionStorage,
            key: config.session.key,
            cookie: {
                httpOnly: config.session.httpOnly,
                domain: config.session.domain,
                maxAge: config.session.maxAge,
                secure: config.session.secure
            }
        }));
    },
    setupPassport: function () {
        require('./utils/passport')(this.app);
    },
    setupErrorRoutes: function () {
        this.app.use(function (err, req, res, next) {
            // If the error object doesn't exists
            if (!err) {
                return next();
            }

            // Log it
            logger.error('Error: ' + err.stack);

            res.status(500).send({
                msg: '抱歉，我们遇到了一些问题，请稍后再试!',
                data: {
                    err: err.message
                }
            });
        });
    },
    loadServerRoutes: function () {
        var app = this.app;
        _.map(require('./controllers')(this), function (v) {
            var method = v['method'] || 'get',
                url = v['url'] || '/',
                action = v['action'] || function (req, res) {
                        return res.json(404, {
                            err: 'Not Found: ' + method + ' ' + url
                        });
                    };
            app[method](url, action);
        });
    },
    bootstrap: function (onReady, onClose) {
        var self = this,
            httpServer = self.app.listen(process.env.PORT || 5000, function () {
                if (onReady) {
                    onReady(self);
                }
            });
        httpServer.on('close', function () {
            if (self._closed) {
                return;
            }
            logger.info('Clean up all managed resources');
            if (self.resMgr) {
                self.resMgr.close();
            }
            self._closed = true;
        });
        process.on('exit', function () {
            if (!self._closed) {
                logger.warn('The http server is not shutdown gracefully');
                httpServer.close();
            }
        });
        var prcessEndHandler = function () {
            httpServer.close(function (err) {
                if (onClose) {
                    onClose();
                }
                if (err) {
                    logger.error('Something wrong: ' + err);
                    process.exit(1);
                } else {
                    process.exit(0);
                }
            });
        };
        process.on('SIGINT', prcessEndHandler);
        process.on('SIGBREAK', prcessEndHandler);
    }
};

module.exports = Server;

/**
 * run the server with automatically configurations
 * @param {Function} onReady
 * @param {Function} onClose
 */
module.exports.run = function (onReady, onClose) {
    var server = new Server(express());
    server.setupMiddlewares();
    server.setupSession();
    // server.setupPassport();
    server.setupErrorRoutes();
    server.loadServerRoutes();
    server.bootstrap(onReady, onClose);
};