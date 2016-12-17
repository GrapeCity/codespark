var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var ContestSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
            unique: true
        },
        displayName: {
            type: String,
            trim: true
        },
        title: {
            type: String,
            trim: true,
            required: true
        },
        description: {
            type: String
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