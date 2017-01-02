let mongoose = require('../utils/mongoose'),
    Schema = mongoose.Schema;

let ProblemSchema = new Schema(
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
    {collection: 'csProblems'}
);

mongoose.model('Problem', ProblemSchema);