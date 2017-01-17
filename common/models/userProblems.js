let mongoose = require('../utils/mongoose'),
    Schema   = mongoose.Schema;

let UserProblemsSchema = new Schema(
    {
        user     : {
            type: Schema.Types.ObjectId,
            ref : 'User'
        },
        contest  : {
            type: Schema.Types.ObjectId,
            ref : 'Contest'
        },
        problem  : {
            type: Schema.Types.ObjectId,
            ref : 'Problem'
        },
        score    : {
            type   : Number,
            default: 0
        },
        solutions: {
            type: [{
                id     : Number,
                runtime: {
                    type   : String,
                    enum   : ['javascript', 'java', 'csharp', 'cpp', 'python'],
                    default: 'javascript'
                },
                status : {
                    type   : String,
                    enum   : ['none', 'submitted', 'accepted', 'rejected',
                        'judging', 'judge retry', 'judge succeeded', 'judge failed'],
                    default: 'none'
                },
                source : String,
                score  : {
                    type   : Number,
                    default: 0
                },
                results: [{
                    id     : Number,
                    result : String,
                    console: String,
                    passed : Boolean
                }]
            }]
        }
    },
    {collection: 'csUserProblems'}
);

mongoose.model('UserProblems', UserProblemsSchema);