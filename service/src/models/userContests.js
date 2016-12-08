var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserContestsSchema = new Schema(
    {
        email: {
            type: String,
            unique: true,
            required: true,
            sparse: true,
            lowercase: true,
            trim: true
        },
        contests: {
            type: [{
                institution: Number,
                roles: [{
                    type: String,
                    enum: ['cs-user', 'cs-admin', 'gc-user']
                }]
            }]
        }
    },
    {collection: 'csUserContests'}
);

mongoose.model('UserContests', UserContestsSchema);