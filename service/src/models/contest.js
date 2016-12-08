var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var ContestSchema = new Schema(
    {
        displayName: {
            type: String,
            trim: true
        },
    },
    {collection: 'csContest'}
);

mongoose.model('Contest', ContestSchema);