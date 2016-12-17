var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ProblemSchema = new Schema(
    {
        name: {
            type: String,
            unique: true,
            required: true
        },
        title: {
            type: String,
            trim: true,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        cases: [{
            id: {
                type: Number,
                required: true
            },
            input: {
                type: String,
                required: true
            },
            expect: {
                type: String,
                required: true
            }
        }]
    },
    {collection: 'csProblem'}
);

mongoose.model('Problem', ProblemSchema);