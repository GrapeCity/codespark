let mongoose = require('mongoose'),
    Schema = mongoose.Schema;


let ContestSchema = new Schema(
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
        description: {
            type: String
        },
        open: {
            type: Boolean
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