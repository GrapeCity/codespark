let mongoose = require('../utils/mongoose'),
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
                runtime: {
                    type: String,
                    enum: ['javascript', 'java', 'csharp', 'cpp', 'python'],
                    default: 'javascript'
                },
                status: {
                    type: String,
                    enum: ['none', 'submitted', 'accepted', 'rejected', 'judged'],
                    default: 'none'
                },
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