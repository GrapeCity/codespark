let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let UserProblemsSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        contest: {
            type: Schema.Types.ObjectId,
            ref: 'Contest'
        },
        problem: {
            type: Schema.Types.ObjectId,
            ref: 'Problem'
        },
        solutions: {
            type: [{
                id: Number,
                status: String,
                source: String,
                result: {
                    type: {
                        score: Number,
                        console: [String]
                    }
                }
            }]
        }
    },
    {collection: 'csUserProblems'}
);

mongoose.model('UserProblems', UserProblemsSchema);