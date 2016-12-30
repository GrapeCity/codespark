let fs = require('fs'),
    crypto = require('crypto'),
    exec = require('child_process').exec,
    express = require('express'),
    redis = require('redis'),
    kue = require('kue'),
    request = require('request'),
    mkdirp = require('mkdirp'),
    mapiSecurity = require('../../../common/utils/mapiSecurity'),
    logger = require('../../../common/utils/winston').appLogger,
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
    queue = kue.createQueue({
        redis: redisOption
    }),
    maxConcurrent = parseInt(process.env.CONCURRENT, 10) || 4;

queue.process('judge', maxConcurrent, (job, done) => {
    // 1. get the judge basic info: {user._id, contest._id, problem._id, {solution} }
    let reqHost = process.env.MAPI_HOST || 'http://localhost:8000',
        {userId, contestId, problemId, solutionId} = job.data,
        accessToken = mapiSecurity.accessToken();
    logger.info(`[${contestId}] [${problemId}] [${userId}] begin process judge`);
    request({
        method: 'GET',
        uri: `${reqHost}/mapi/judge`,
        qs: {userId, contestId, problemId, solutionId},
        headers: {
            'Authorization': `Basic ${accessToken}`
        }
    }, (err, res, data) => {
        job.progress(5, 100, {msg: 'prepare data'});
        if (err) {
            logger.error(`[${contestId}] [${problemId}] [${userId}] prepare data error: ${err}`);
            return done(err);
        }

        // 2. write users' data to /data/user_id/contest_id/problem_id/solution_id/source.js
        try {
            logger.info(`[${contestId}] [${problemId}] [${userId}] write judge data`);
            mkdirp.sync(`/data/${userId}/${contestId}/${problemId}/${solutionId}/cases`);

            data.cases.forEach(c => {
                let {id, input, expect} = c;
                fs.writeFileSync(
                    `/data/${userId}/${contestId}/${problemId}/${solutionId}/cases/${id}.in`,
                    input,
                    'utf8'
                );
                fs.writeFileSync(
                    `/data/${userId}/${contestId}/${problemId}/${solutionId}/cases/${id}.out`,
                    expect,
                    'utf8'
                );
            });
            fs.writeFileSync(
                `/data/${userId}/${contestId}/${problemId}/${solutionId}/source.js`,
                data.source,
                'utf8'
            );
            fs.writeFileSync(
                `/data/${userId}/${contestId}/${problemId}/${solutionId}/result.json`,
                JSON.stringify({score: 0}),
                'utf8'
            );
        } catch (any) {
            logger.error(`[${contestId}] [${problemId}] [${userId}] write judge data error: ${any}`);
            return done(any);
        }

        let image = process.env.JUDGE_IMAGE_JAVASCRIPT || 'codespark-judge-javascript',
            cmd = ['node', 'index.js'];
        switch (data.runtime) {
            case 'java':
                image = process.env.JUDGE_IMAGE_JAVA || 'codespark-judge-java';
                break;
            case 'csharp':
                image = process.env.JUDGE_IMAGE_CSHARP || 'codespark-judge-csharp';
                break;
            case 'cpp':
                image = process.env.JUDGE_IMAGE_CPP || 'codespark-judge-cpp';
                break;
            case 'python':
                image = process.env.JUDGE_IMAGE_PYTHON || 'codespark-judge-python';
                break;
        }

        // 3. create a docker container and bind users' data folder, and running it
        docker.run(image, cmd, [process.stdout, process.stderr],
            // create options
            {
                Tty: false,
                NetworkDisabled: true,
                HostConfig: {
                    binds: [`/data/${userId}/${contestId}/${problemId}/${solutionId}:/app/data`],
                    Memory: 1024 * 1024 * 250,
                    NetworkMode: 'none'
                }
            },
            (err, data, container) => {
                job.progress(80, 100, {msg: 'judge finished'});
                try {
                    if (err) {
                        logger.error(`run docker error: ${err}`);
                        if (container) {
                            job.progress(95, 100, {msg: 'judge finished with error'});
                            return container.remove((err2, data) => {
                                done(err2 || err);
                            });
                        }
                        return done(err);
                    }

                    // container is now stopped
                    // safe to check result of the solution
                    let out = fs.readFileSync(
                        `/data/${userId}/${contestId}/${problemId}/${solutionId}/result.json`, 'utf8');
                    request({
                        method: 'GET',
                        uri: `${reqHost}/mapi/judge`,
                        qs: {userId, contestId, problemId, solutionId},
                        headers: {
                            'Authorization': `Basic ${accessToken}`
                        },
                        body: out,
                        json: true
                    }, (err /*, res, body*/) => {
                        if (err) {
                            // error while reporting
                            job.progress(95, 100, {msg: 'judge report error'});
                            return container.remove((err, data) => {
                                done(err);
                            });
                        }
                        container.remove((err, data) => {
                            if (err) {
                                return done(err);
                            }
                            done(null, {score: JSON.parse(out).score});
                        });
                    });
                } catch (any) {
                    return done(any);
                }
            })
            .on('container', () => {
                job.progress(20, 100, {msg: 'docker container is ready'})
            })
            .on('stream', () => {
                job.progress(30, 100, {msg: 'judge started'})
            });
    });
});

app.get('/', (req, res) => {
    res.send('This worker is working')
});

function invoke(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout/*, stderr*/) => {
            if (error) {
                return reject(error);
            }
            resolve(stdout);
        });
    });
}

app.get('/health', (req, res) => {
    Promise.all([
        invoke(`grep 'cpu ' /host/proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage "%"}'`),
        invoke(`grep 'MemAvailable' /host/proc/meminfo | awk '{usage=$2/1024} END {print usage "MB"}'`)
    ]).then(datas => {
        res.status(200).json({
            cpu: datas[0].trim(),
            memory: datas[1].trim()
        })
    }).catch(errors => {
        res.status(500).json({
            err: true,
            msg: JSON.stringify(errors),
            timestamp: new Date().getTime()
        });
    });
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
