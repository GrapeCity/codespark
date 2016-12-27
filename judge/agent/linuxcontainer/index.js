// let Docker = require('dockerode'),
//     docker = new Docker(),
//     util = require('util');
//
// docker.info((err, info) => {
//     console.log(util.inspect(info));
// });

let express = require('express'),
    redis = require('redis'),
    app = express(),
    redisSubClient = redis.createClient({
        host: process.env.REDIS_PORT_6379_TCP_ADDR || '127.0.0.1',
        port: process.env.REDIS_PORT_6379_TCP_PORT || '6379',
        password: process.env.REDIS_PASSWORD,
        retry_strategy: opt => {
            if (opt.error && opt.error.code === 'ECONNREFUSED') {
                // End reconnecting on a specific error and flush all commands with a individual error
                return new Error('The server refused the connection');
            }
            if (opt.total_retry_time > 1000 * 60 * 60) {
                // End reconnecting after a specific timeout and flush all commands with a individual error
                return new Error('Retry time exhausted');
            }
            if (opt.times_connected > 10) {
                // End reconnecting with built in error
                return undefined;
            }
            // reconnect after
            return Math.min(opt.attempt * 100, 3000);
        }
    });

redisSubClient.on('error', err => console.log(`Redis Error: ${err}`));

redisSubClient.on('subscribe', (channel, count) => {
    console.log(`channel [${channel}] is now ready to subscribe message`)
});

redisSubClient.on('message', (channel, message) => {
    console.log(`channel [${channel}]: ${message}`);
});

app.get('/', (req, res) => {
   res.send('This worker is working')
});

// bootstrap http server
let httpServer = app.listen(process.env.PORT || 8001, function () {
    redisSubClient.subscribe('judge');

    console.log('\n================================================\n' +
        'Service run successful at ' + (new Date()).toLocaleString() + '\n' +
        'Http Port   : ' + (process.env.PORT || 8001) + '\n' +
        '================================================');
});
httpServer.on('close', () => {
    if (app._closed) {
        return;
    }
    console.log('Worker is now shutting down, and close redis subscribe channel');
    redisSubClient.unsubscribe();
    redisSubClient.quit();
    app._closed = true;
});

function prcessEndHandler() {
    console.log("Process event received, now will terminate server gracefully");
    httpServer.close(err => {
        if (err) {
            console.log('Something wrong: ' + err);
            process.exit(1);
        } else {
            console.log('\n================================================\n' +
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
