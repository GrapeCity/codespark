/**
 * level for winston can specify one of
 *      {
 *          error: 0,
 *          warn: 1,
 *          info: 2,
 *          verbose: 3,
 *          debug: 4,
 *          silly: 5
 *      }
 * https://www.npmjs.com/package/winston
 */

var fs = require('fs'),
    winston = require('winston'),
    DailyRotateFile = require('winston-daily-rotate-file'),
    Logger = winston.Logger,
    logDir = './logs';

// Create directory for log
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

winston.emitErrs = true;

var appLogger = winston.loggers.add('application', {});
appLogger.transports = [];
appLogger.exitOnError = false;

appLogger.add(DailyRotateFile, {
    level: 'info',
    dirname: logDir,
    filename: 'app.service.log',
    handleExceptions: true,
    humanReadableUnhandledException: true,
    json: false,
    maxsize: 5242880, //5MB
    maxFiles: 5,
    colorize: false
});
if (process.env.NODE_ENV === 'development') {
    appLogger.add(winston.transports.Console, {
        level: 'debug',
        handleExceptions: true,
        humanReadableUnhandledException: true,
        json: false,
        colorize: true
    });
}

var accessLogger = winston.loggers.add('access', {});
accessLogger.transports = [];
accessLogger.exitOnError = false;
accessLogger.add(DailyRotateFile, {
    level: 'info',
    dirname: logDir,
    filename: 'access.service.log',
    handleExceptions: true,
    humanReadableUnhandledException: true,
    json: false,
    maxsize: 5242880, //5MB
    maxFiles: 5,
    colorize: false
});
if (process.env.NODE_ENV === 'development') {
    accessLogger.add(winston.transports.Console, {
        level: 'debug',
        handleExceptions: true,
        humanReadableUnhandledException: true,
        json: false,
        colorize: true
    });
}

module.exports = {
    appLogger: appLogger,
    stream: {
        write: function(message, encoding){
            accessLogger.info(message);
        }
    }
};