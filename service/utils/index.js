let mongoose = require('../../common/utils/mongoose'),
    redis = require('../../common/utils/redis'),
    winston = require('../../common/utils/winston'),
    Configure = require('../../common/utils/configure'),
    ResourceManager = require('../../common/utils/resourceManager');

module.exports = {
    mongoose,
    redis,
    winston,
    Configure,
    ResourceManager
};