let mongoose = require('../utils/mongoose'),
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
        open: {
            type: Boolean,
            default: false
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
    {collection: 'csContests'}
);

mongoose.model('Contest', ContestSchema);