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

    function updateSolution(userId, contestId, problemId, solutionId, status, result = null) {
        UserProblems.findOne({user: userId, contest: contestId, problem: problemId})
            .select('solutions')
            .exec((err, up) => {
                if (err) {
                    return logger.error(`There is an error while read database: ${err}`);
                }
                if (!up) {
                    return logger.error(`There is no such record: user=${userId}, contest=${contestId}, problem=${problemId}`);
                }
                let solution = _.find(up.solutions, s => s.id == solutionId);
                if (!solution) {
                    return logger.error(`there is no such solution: user=${userId}, contest=${contestId}, problem=${problemId}, solution=${solutionId}`);
                }
                solution.status = status;
                if (result) {
                    solution.result = result;
                }
                up.save(err => {
                    if (err) {
                        return logger.error(`There is an error while write database: ${err}`);
                    }
                })
            });
    }

    /**
     *
     * @param {string} userId
     * @param {string} contestId
     * @param {string} problemId
     * @param {string} solutionId
     */
    function createJudgeTask(userId, contestId, problemId, solutionId) {
        console.log(`create a judge task for ${userId}:${contestId}:${problemId}:${solutionId}`);
        let judge = queue.create('judge', {userId, contestId, problemId, solutionId})
            .ttl(20 * 1000)
            .delay(500)
            .attempts(3).backoff({delay: 2000, type: 'fixed'})
            .removeOnComplete(true);
        judge.on('start', () => {
            console.log(`judge #${judge.id} is started`);
            updateSolution(userId, contestId, problemId, solutionId, 'judging');
        }).on('complete', result => {
            console.log(`judge #${judge.id} is done, with result: ${result}`);
            // write data to db
            updateSolution(userId, contestId, problemId, solutionId, 'judge succeeded', JSON.parse(result));
        }).on('failed attempt', function (errMessage, doneAttempts) {
            console.log(`judge #${judge.id} ${doneAttempts}th failed: ${errMessage}`);
            updateSolution(userId, contestId, problemId, solutionId, 'judge retry');
        }).on('failed', errMessage => {
            console.log(`judge #${judge.id} has failed: ${errMessage}`);
            updateSolution(userId, contestId, problemId, solutionId, 'judge failed');
        }).on('progress', function (progress, data) {
            console.log(`\r  judge #${judge.id} ${progress}% complete with data: ${data}`);
        });
        judge.save();
    }

    client.on("subscribe", function (channel, count) {
        logger.info('ready to receive message');

        // check database if there are some task pending (solution.status=='submitted')
        UserProblems.find({"solutions.status": {$eq: 'submitted'}})
            .exec((err, ups) => {
                if (err) {
                    logger.error(`Error reading database: ${err}`);
                }
                console.log(`there are ${(ups && ups.length) || 0} pending to process`);
                if (ups && ups.length > 0) {
                    ups.forEach(up => {
                        up.solutions.forEach(s => {
                            if (s.status !== 'submitted') {
                                return;
                            }
                            createJudgeTask(up.user, up.contest, up.problem, s.id);
                        });
                    })
                }
            });
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
                if (!data || !(solution = _.find(data.solutions, s => s.id === solutionId))) {
                    logger.warn(`Solution [user:${userId}, contest:${contestId}, problem:${problemId}, solution:${solutionId}] is not found`);
                    return;
                }

                createJudgeTask(userId, contestId, problemId, solutionId);
            });
    });
    client.subscribe('solution-ready');
};