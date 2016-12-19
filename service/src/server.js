/**
 * Load module dependencies
 */
let express = require('express'),
    _ = require('lodash'),
    ResourceManager = require('./utils/resourceManager'),
    config = require('./config'),
    logger = require('./utils/winston').appLogger;

class Server {
    /**
     * Create an instance which wraps current application, and manage all inner resources
     * @param app
     * @constructor
     */
    constructor(app) {
        this.app = app;
        this.resMgr = new ResourceManager();
    }

    setupMiddlewares() {
        let morgan = require('morgan'),
            RateLimit = require('express-rate-limit'),
            RateRedisStore = require('rate-limit-redis'),
            bodyParser = require('body-parser'),
            cookieParser = require('cookie-parser'),
            stream = require('./utils/winston').stream;

        // Showing stack errors
        this.app.set('showStackError', true);
        this.app.set('trust proxy', true);

        // Logging with Morgan and winston(https://github.com/expressjs/morgan) format
        // for morgan can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
        // this.app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
        //     stream: stream
        // }));
        this.app.use(morgan('combined', {
            stream: stream
        }));

        if (process.env.NODE_ENV === 'development') {
            let path = require('path');
            this.app.use(express.static(path.resolve(process.cwd(), '../site/dist')));
        }

        // limit api access rating

        //  apply to all accounts requests
        let apiLimit = new RateLimit({
            windowMs: 60 * 1000, // 1 minutes
            max: 60, // limit each IP to 100 requests per windowMs
            delayMs: 0, // disable delaying - full speed until the max limit is reached
            store: new RateRedisStore({
                client: require('./utils/redis')(this)
            }),
            message: "当前IP尝试访问API次数过多，请1分钟后重试"
        });
        this.app.use(apiLimit);

        // Request body parsing middleware should be above methodOverride
        this.app.use(bodyParser.urlencoded({limit: '5mb', extended: true}));
        this.app.use(bodyParser.json({limit: '5mb'}));

        // Add the cookie parser and flash middleware
        this.app.use(cookieParser());
    }

    setupSession() {
        let session = require('express-session'),
            RedisStore = require('connect-redis')(session),
            sessionStorage = new RedisStore({
                client: require('./utils/redis')(this)
            });

        if (!sessionStorage) {
            let MemoryStore = session.MemoryStore;
            sessionStorage = new MemoryStore();
            logger.warn('Fallback : Using MemoryStore for the Session.');
        }

        this.app.use(session({
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
    }

    setupPassport() {
        require('./utils/passport')(this.app);
    }

    setupErrorRoutes() {
        this.app.use((err, req, res, next) => {
            // If the error object doesn't exists
            if (!err) {
                return next();
            }

            // Log it
            logger.error('Server Error: ' + err.stack);

            res.status(500).send({
                msg: '抱歉，我们遇到了一些问题，请稍后再试!',
                data: {
                    err: err.message
                }
            });
        });
    }

    loadServerRoutes() {
        let passport = require('passport'),
            accounts = require('./controllers/accounts')(this);

        this.app.post('/sapi/accounts/login', (req, res, next) => {
            passport.authenticate('local', (err, user, info) => {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    logger.warn('user [%s] login failed from [%s], reason: [%s]',
                        req.body.mail,
                        (req.headers["X-Forwarded-For"] || req.headers["x-forwarded-for"] || '').split(',')[0] || req.client.remoteAddress,
                        info && info.msg);
                    return next();
                }
                req.logIn(user, err => {
                    if (err) {
                        return next(err);
                    }
                    next();
                });
            })(req, res, next);
        }, accounts.login);

        _.map(require('./controllers')(this), (v) => {
            let method = v['method'] || 'get',
                url = '/sapi' + v['url'] || '',
                action = v['action'] || ((req, res) => res.json(404, {
                        err: 'Not Found: ' + method + ' ' + url
                    }));
            if (v['protect']) {
                this.app[method](url, accounts.protect, action);
            } else {
                this.app[method](url, action);
            }
        });
    }

    bootstrap(onReady, onClose) {
        let httpServer = this.app.listen(process.env.PORT || 5000, () => {
            if (onReady) {
                onReady(this);
            }
        });
        httpServer.on('close', () => {
            if (this._closed) {
                return;
            }
            logger.info('Clean up all managed resources');
            if (this.resMgr) {
                this.resMgr.close();
            }
            this._closed = true;
        });
        process.on('exit', () => {
            if (!this._closed) {
                logger.warn('The http server is not shutdown gracefully');
                httpServer.close();
            }
        });
        let prcessEndHandler = () => {
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
        // posix, for linux, unix etc.
        process.on('SIGINT', prcessEndHandler);
        // window, use CTRL+BREAK to gracefully shutdown
        process.on('SIGBREAK', prcessEndHandler);
        // force kill
        process.on('SIGTERM', prcessEndHandler);
    }
}


module.exports = Server;

/**
 * run the server with automatically configurations
 * @param {Function} onReady
 * @param {Function} onClose
 */
module.exports.run = function (onReady, onClose) {
    let server = new Server(express());
    require('./utils/mongoose')(server, () => {
        server.setupMiddlewares();
        server.setupSession();
        server.setupPassport();
        server.setupErrorRoutes();
        server.loadServerRoutes();
        server.bootstrap(onReady, onClose);
    });
};