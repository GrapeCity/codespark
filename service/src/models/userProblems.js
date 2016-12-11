var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserProblemsSchema = new Schema(
    {
        email: {
            type: String,
            unique: true,
            required: true,
            sparse: true,
            lowercase: true,
            trim: true
        },
        problem: {
            type: Schema.Types.ObjectId,
            ref: 'Problem'
        },
        solutions: {
            type: [{
                id: Number,
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