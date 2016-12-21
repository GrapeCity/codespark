let mongoose = require('mongoose'),
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