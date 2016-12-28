let http = require('http'),
    kue = require('kue'),
    jobs = kue.createQueue(),
    count = 0;
pending = [];

function newJob(name) {
    name = name || 'Default_Name';
    let job = jobs.create('judge', {
        name: name
    })
        .ttl(20 * 1000)
        .removeOnComplete(true);
    job.on('complete', function () {
        console.log('Job', job.id, 'with name', job.data.name, 'is done');
    }).on('failed', function () {
        console.log('Job', job.id, 'with name', job.data.name, 'has failed');
    });
    job.save();
    pending.push(job);
}

setInterval(function () {
    console.log(`create job: [${count}]`);
    newJob(`[${count}] Send_Email`);
    count++;
}, 2000);

let server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.end('This server is living');
})
    .listen(8010)
    .on('close', () => {
        console.log("=======> All task done ");
    });