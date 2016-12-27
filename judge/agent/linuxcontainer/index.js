let Docker = require('dockerode'),
    docker = new Docker();

docker.info((err, info) => {
    console.log(JSON.stringify(info));
});