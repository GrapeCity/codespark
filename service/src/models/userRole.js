var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserRolesSchema = new Schema(
    {
        email: {
            type: String,
            unique: true,
            required: true,
            sparse: true,
            lowercase: true,
            trim: true
        },
        roles: {
            type: [{
                institution: Number,
                roles: [{
                    type: String,
                    enum: ['cs-user', 'cs-admin', 'gc-user']
                }]
            }],
            default: [{
                institution: 0,
                roles: ['cs-user']
            }]
        }
    },
    {collection: 'csUserRoles'}
);

mongoose.model('UserRoles', UserRolesSchema);