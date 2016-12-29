let redis = require('redis'),
    _ = require('lodash'),
    kue = require('kue'),
    logger = require('../../common/utils/winston').appLogger,
    mongoose = require('../../common/utils/mongoose'),
    UserProblems = mongoose.model('UserProblems');

function updateSolution(userId, contestId, problemId, solutionId, result) {
    UserProblems.findOne({user: userId, contest: contestId, problem: problemId})
        .exec((err, data) => {
            if (err) {
                logger.error(`Query UseProblems error: ${err}`);
                return;
            }
            if (!data) {
                logger.warn(`Solution [user: ${userId}, contest: ${contestId}, problem: ${problemId}] is not found`);
                return;
            }
            let sid = parseInt(solutionId, 10),
                solution = _.find(data.solutions, s => s.id === sid);
            if (!solution) {
                logger.warn(`Solution [user: ${userId}, contest: ${contestId}, problem: ${problemId}, solution: ${solutionId}] is not found`);
                return;
            }
            solution.result = result;
            data.save((err) => {
                if (err) {
                    logger.error(`Save UserProblems error: ${err}`);
                }
            });
        });
}

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
        let data = JSON.parse(message),
            judge = queue.create('judge', data)
                .ttl(20 * 1000)
                .delay(500)
                .removeOnComplete(true);
        judge.on('complete', function () {
            console.log('Job', job.id, 'with name', job.data.name, 'is done');
            // write data to db
        }).on('failed', function () {
            console.log('Job', job.id, 'with name', job.data.name, 'has failed');
            // write data to db

        });
        judge.save();
    });
    client.subscribe('solution-ready');
};