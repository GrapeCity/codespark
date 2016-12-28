let crypto = require('crypto'),
    express = require('express'),
    redis = require('redis'),
    kue = require('kue'),
    Docker = require('dockerode'),
    docker = new Docker(),
    app = express(),
    redisOption = {
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
    },
    redisDataClient = redis.createClient(redisOption),
    queue = kue.createQueue({
        prefix: crypto.randomBytes(3).toString('base64'),
        redis: redisOption
    });

queue.process('judge', 5, (job, done) => {
    // 1. get the judge basic info: {user._id, contest._id, problem._id, {solution} }
    docker.run(process.env.JUDGE_IMAGE || 'codespark-runner-js',
        ['node', 'index.js'],
        [],
        // create options
        {
            NetworkDisabled: true,
            HostConfig: {
                binds: ['/data/user_id/contest_id/problem_id/solution_id:/app/data'],
                Memory: 1024 * 1024 * 250,
                NetworkMode: 'none'
            }
        },
        // start options
        {},
        (err, data, container) => {
            if (err) {
                // report running in error
                //
            }
            // container is now stopped
            // safe to check result of the solution
        });
});

app.get('/', (req, res) => {
    res.send('This worker is working')
});

// bootstrap http server
let httpServer = app.listen(process.env.PORT || 8001, function () {
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
