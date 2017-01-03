let http = require('http'),
    crypto = require('crypto'),
    kue = require('kue'),
    jobs = kue.createQueue();

jobs.process('judge', 5, function (job, done) {
    realWorker(job, 1, crypto.randomBytes(1)[0] * 5, done);
});

function realWorker(job, i, sleep, done) {
    console.log(`[${new Date().toLocaleTimeString()}] [${job.id}] [${JSON.stringify(job.data)}]: ${i * 20}%`);
    if (i >= 5) {
        return done(null, JSON.stringify({
            score: crypto.randomBytes(1)[0] % 100,
            console: ['test']
        }));
    }
    setTimeout(() => {
        job.progress(i, 5);
        realWorker(job, i + 1, sleep, done);
    }, sleep);
}

let server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.end('This server is living');
})
    .listen(8011)
    .on('close', () => {
        console.log("=======> worker close ");
    });