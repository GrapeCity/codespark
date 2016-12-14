process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    winston = require('./utils/winston'),
    stream = winston.stream,
    logger = winston.appLogger,
    app = express();

// Showing stack errors
app.set('showStackError', true);
app.set('trust proxy', true);

// Logging with Morgan and winston(https://github.com/expressjs/morgan) format
// for morgan can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
app.use(morgan('combined', {
    stream: stream
}));

// Request body parsing middleware should be above methodOverride
app.use(bodyParser.urlencoded({limit: '5mb', extended: true}));
app.use(bodyParser.json({limit: '5mb'}));

// Add the cookie parser and flash middleware
app.use(cookieParser());

app.use(function (err, req, res, next) {
    // If the error object doesn't exists
    if (!err) {
        return next();
    }

    // Log it
    logger.error('Error: ' + err.stack);

    res.status(500).send({
        err: true,
        msg: '抱歉，我们遇到了一些问题，请稍后再试!',
        data: {
            err: err.message
        }
    });
});

// setup server controller
app.get("/", function (req, res) {
    return res.status(200).json({
    });
});

// bootstrap http server
var httpServer = app.listen(process.env.PORT || 6000, function () {
    logger.info('\n================================================\n' +
        'Service run successful at ' + (new Date()).toLocaleString() + '\n' +
        'Http Port   : ' + (process.env.PORT || 6000) + '\n' +
        '================================================');
});

httpServer.on('close', function () {
    if (app._closed) {
        return;
    }
    logger.info('Clean up all managed resources');
    app._closed = true;
});
process.on('exit', function () {
    if (!app._closed) {
        logger.warn('The http server is not shutdown gracefully');
        httpServer.close();
    }
});

function prcessEndHandler() {
    httpServer.close(function (err) {
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