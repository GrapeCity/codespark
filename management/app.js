process.env.NODE_ENV = process.env.NODE_ENV || 'development';

let path = require('path'),
    express = require('express'),
    morgan = require('morgan'),
    helmet = require('helmet'),
    compression = require('compression'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    kue = require('kue'),
    utils = require('./utils'),
    mongoose = utils.mongoose,
    redis = utils.redis,
    winston = utils.winston,
    stream = winston.stream,
    logger = winston.appLogger,
    app = express(),
    config = new utils.Configure(),
    resMgr = new utils.ResourceManager();

resMgr.add('config', config, () => config.close(() => {
    logger.info('Config disposed successfully');
}));
config.setup('mongo', {
    uri: `${process.env.MONGO_PORT_27017_TCP_ADDR || '127.0.0.1'}:${process.env.MONGO_PORT_27017_TCP_PORT || '27017'}/codespark`,
    options: {},
    debug: (process.env.NODE_ENV === 'development')
});
config.setup('redis', {
    host: process.env.REDIS_PORT_6379_TCP_ADDR || '127.0.0.1',
    port: process.env.REDIS_PORT_6379_TCP_PORT || '6379',
    password: process.env.REDIS_PASSWORD || ''
});
config.setup('basicAuth', {
    user: process.env.MANAGE_USER || require('crypto').randomBytes(6).toString('base64'),
    password: process.env.MANAGE_PASSWORD || require('crypto').randomBytes(12).toString('base64')
});
mongoose.setup(config.mongo, resMgr);
redis.setup(config.redis, resMgr);

let queue = kue.createQueue({
    redis: config.redis
});
resMgr.add('queue', queue, () => {
    queue.shutdown(5000, (err) => {
        if (err) {
            logger.error(`Kue shutdown failed: ${err}`);
            return;
        }
        logger.info('Kue shutdown successfully');
    });
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Showing stack errors
app.set('showStackError', true);
app.set('trust proxy', true);

// Logging with Morgan and winston(https://github.com/expressjs/morgan) format
// for morgan can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
app.use(morgan('combined', {
    stream: stream
}));

app.use(compression());
app.use(helmet());
app.disable('x-powered-by');

app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/fonts', express.static(path.join(__dirname, 'public/fonts')));
app.use('/img', express.static(path.join(__dirname, 'public/img')));

// Request body parsing middleware should be above methodOverride
app.use(bodyParser.json({limit: '20mb'}));
app.use(bodyParser.urlencoded({limit: '20mb', extended: true}));

// Add the cookie parser and flash middleware
app.use(cookieParser());

// include models
require('../common/models');

// setup message subscriber
require('./utils/subscriber')(config.redis, resMgr);

// setup backend web apis
require('./mapi')(app, config);

// setup server controller
require('./routers')(app, config);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    let err = new Error(`Not Found: ${req.url}`);
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    // If the error object doesn't exists
    if (!err) {
        return next();
    }

    err.status = err.status || 500;
    err.message = err.message || 'Something unknown error happened!';
    res.locals.title = 'Error';
    res.locals.message = err.message;
    res.locals.error = app.get('env') === 'development' ? err : {};

    // Log it
    logger.error('Error: ' + err.stack);

    res.status(err.status).render('error');
});


// bootstrap http server
let httpServer = app.listen(process.env.PORT || 8000, function () {
    logger.info('\n================================================\n' +
        'Service run successful at ' + (new Date()).toLocaleString() + '\n' +
        'Http Port   : ' + (process.env.PORT || 8000) + '\n' +
        'Mongo       : ' + config.mongo.uri + '\n' +
        'Http Basic  : ' + config.basicAuth.user + ' ' + config.basicAuth.password + '\n' +
        '================================================');
});

httpServer.on('close', () => {
    if (app._closed) {
        return;
    }
    logger.info('Clean up all managed resources');
    resMgr.close();
    app._closed = true;
});

let trackedConnections = [];
httpServer.on('connection', (conn) => {
    conn.on('close', () => {
        trackedConnections.splice(trackedConnections.indexOf(conn));
    });
    trackedConnections.push(conn);
    if (trackedConnections.length > 100) {
        logger.warn(`Server concurrent connections includes to ${trackedConnections.length}`);
    } else if (trackedConnections.length > 1000) {
        logger.error(`Server concurrent connections includes to ${trackedConnections.length}`);
    }
});

process.on('exit', () => {
    if (!app._closed) {
        logger.warn('The http server is not shutdown gracefully');
        httpServer.close();
    }
});

function prcessEndHandler() {
    console.log("Process event received, now will terminate server gracefully");
    while (trackedConnections.length > 0) {
        console.log(`there are ${trackedConnections.length} active connection remained`);
        trackedConnections.pop().destroy();
    }
    console.log("All connections are closed, request http server shutdown");
    httpServer.close(err => {
        if (err) {
            logger.error('Something wrong: ' + err);
            process.exit(1);
        } else {
            logger.info('\n================================================\n' +
                'Service is now stopped\n' +
                '================================================');
            process.exit(0);
        }
    });
}
// posix, for linux, unix etc.
process.on('SIGINT', prcessEndHandler);
// window, use CTRL+BREAK to gracefully shutdown
process.on('SIGBREAK', prcessEndHandler);
// force kill
process.on('SIGTERM', prcessEndHandler);