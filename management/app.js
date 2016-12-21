process.env.NODE_ENV = process.env.NODE_ENV || 'development';

let path = require('path'),
    express = require('express'),
    mongoose = require('mongoose'),
    morgan = require('morgan'),
    helmet = require('helmet'),
    compression = require('compression'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    winston = require('./utils/winston'),
    stream = winston.stream,
    logger = winston.appLogger,
    app = express();

// Use native Promise
mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${process.env.MONGO_PORT_27017_TCP_ADDR || '127.0.0.1'}:${process.env.MONGO_PORT_27017_TCP_PORT || '27017'}/codespark`,
    err => {
        if (err) {
            logger.warn(`Could not connect to MongoDB: ${err}`);
        } else {
            if (process.env.NODE_ENV !== 'development') {
                logger.info('Connect to MongoDB success.');
            }
            // Enabling mongoose debug mode if debugging
            mongoose.set('debug', process.env.NODE_ENV === 'development');
        }
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
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({limit: '5mb', extended: true}));

// Add the cookie parser and flash middleware
app.use(cookieParser());

// include models
require('./models/index');

// setup server controller
require('./routers/index').forEach(elem => app.use(elem.key, elem.value));

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
        '================================================');
});

httpServer.on('close', () => {
    if (app._closed) {
        return;
    }
    logger.info('Clean up all managed resources');
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