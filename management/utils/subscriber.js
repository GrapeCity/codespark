let redis = require('redis'),
    _ = require('lodash'),
    kue = require('kue'),
    logger = require('../../common/utils/winston').appLogger,
    mongoose = require('../../common/utils/mongoose'),
    UserProblems = mongoose.model('UserProblems');

module.exports = (config, resMgr) => {
    let client = redis.createClient(config),
        queue = kue.createQueue(config);
    resMgr.add('subscriber', client, () => {
        client.unsubscribe();
        client.quit();
        logger.info('Disconnected from Redis successfully');
    });
    client.on("subscribe", function (channel, count) {
        logger.info('ready to receive message')
    });
    client.on("message", function (channel, message) {
        console.log("sub channel " + channel + ": " + message);
        // message should like:
        // {userId, contestId, problemId, solutionId}
        let solutionData;
        try {
            solutionData = JSON.parse(message);
        } catch (any) {
            logger.error(`Error parse message: ${any}`);
            return;
        }
        let {userId, contestId, problemId, solutionId} = solutionData;
        if (!userId || !contestId || !problemId || !solutionId) {
            logger.error(`Incorrect message: ${message}`);
            return;
        }
        UserProblems.findOne({user: userId, contest: contestId, problem: problemId})
            .exec((err, data) => {
                if (err) {
                    logger.error(`Error read UserProblems: ${err}`);
                    return;
                }
                let solution;
                if (!data || !(solution = _.any(data.solutions, s => s.id === solutionId))) {
                    logger.warn(`Solution [user:${userId}, contest:${contestId}, problem:${problemId}, solution:${solutionId}] is not found`);
                    return;
                }

                let judge = queue.create('judge', solutionData)
                    .ttl(20 * 1000)
                    .delay(500)
                    .attempts(3).backoff({delay: 2000, type: 'fixed'})
                    .removeOnComplete(true);
                judge.on('start', () => {
                    // update status to judging
                    solution.status = 'judging';
                    data.save(err => {
                        logger.error(`Error save UserProblems: ${err}`);
                    });
                }).on('complete', result => {
                    console.log(`judge #${judge.id} is done, with result: ${result}`);
                    // write data to db
                    solution.status = 'judge succeeded';
                    solution.result = result;
                    data.save(err => {
                        logger.error(`Error save UserProblems: ${err}`);
                    });
                }).on('failed attempt', function (errMessage, doneAttempts) {
                    console.log(`judge #${judge.id} ${doneAttempts}th failed: ${errMessage}`);
                    solution.status = 'judge retry';
                    data.save(err => {
                        logger.error(`Error save UserProblems: ${err}`);
                    });
                }).on('failed', errMessage => {
                    console.log(`judge #${judge.id} has failed: ${errMessage}`);
                    // write data to db
                    solution.status = 'judge failed';
                    data.save(err => {
                        logger.error(`Error save UserProblems: ${err}`);
                    });
                }).on('progress', function (progress, data) {
                    console.log(`\r  judge #${judge.id} ${progress}% complete with data: ${data}`);
                });
                judge.save();
            });
    });
    client.subscribe('solution-ready');
};