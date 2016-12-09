var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var ContestSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true
        },
        displayName: {
            type: String,
            trim: true
        },
        begin: {
            type: Date,
            required: true
        },
        end: {
            type: Date,
            required: true
        },
        restricts :[{
            type: String,
            enum: ['cs-user', 'cs-gc-user', 'cs-admin']
        }],
        problems: [{
        }]
    },
    {collection: 'csContest'}
);

mongoose.model('Contest', ContestSchema);