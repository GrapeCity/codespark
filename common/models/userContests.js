let mongoose = require('../utils/mongoose'),
    Schema = mongoose.Schema;

let UserContestsSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        contest: {
            type: Schema.Types.ObjectId,
            ref: 'Contest'
        },
        score: {
            type: Number
        },
        progress: {
            type: Number
        },
        begin: {
            type: Date
        },
        end: {
            type: Date
        }
    },
    {collection: 'csUserContests'}
);

mongoose.model('UserContests', UserContestsSchema);