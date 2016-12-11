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
        problems: {
            type: [{
                type: Schema.Types.ObjectId,
                ref: 'Problem'
            }]
        }
    },
    {collection: 'csContest'}
);

mongoose.model('Contest', ContestSchema);