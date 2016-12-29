let mongoose = require('../../common/utils/mongoose'),
    redis = require('../../common/utils/redis'),
    winston = require('../../common/utils/winston'),
    mapiSecurity = require('../../common/utils/mapiSecurity'),
    Configure = require('../../common/utils/configure'),
    ResourceManager = require('../../common/utils/resourceManager');

module.exports = {
    mongoose,
    redis,
    winston,
    mapiSecurity,
    Configure,
    ResourceManager
};