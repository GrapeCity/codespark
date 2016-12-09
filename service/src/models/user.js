var path = require('path'),
    validator = require('../utils/validator'),
    crypto = require('crypto'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var validateLocalStrategyEmail = function (email) {
    return ((this.provider !== 'local' && !this.updated) || this.mobile || validator.isEmail(email));
};

var UserSchema = new Schema({
        displayName: {
            type: String,
            trim: true
        },
        mail: {
            type: String,
            unique: true,
            required: true,
            sparse: true,
            lowercase: true,
            trim: true,
            validate: [validateLocalStrategyEmail, 'INVALID_EMAIL']
        },
        username: {
            type: String,
            unique: true,
            required: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            default: '',
            index: false
        },
        salt: {
            type: String
        },
        profileImageURL: {
            type: String,
            default: '',
            index: false
        },
        provider: {
            type: String,
            default: 'local',
            required: 'Provider is required'
        },
        providerData: {},
        additionalProvidersData: {},
        roles: [],
        updated: {
            type: Date
        },
        created: {
            type: Date,
            default: Date.now
        },
        resetPasswordToken: {
            type: String
        },
        resetPasswordExpires: {
            type: Date
        },
        activated: {
            type: Boolean,
            default: false
        },
        activeToken: {
            type: String
        },
        activeExpires: {
            type: Date
        }
    },
    {collection: 'csUsers'}
);

/**
 * Hook a pre save method to hash the password
 */
UserSchema.pre('save', function (next) {
    if (this.password && this.isModified('password')) {
        this.salt = crypto.randomBytes(16).toString('base64');
        this.password = this.hashPassword(this.password);
    }

    if (!this.displayName) {
        this.displayName = this.email.substring(0, this.email.lastIndexOf('@'));
    }

    next();
});

/**
 * Create instance method for hashing a password
 */
UserSchema.methods.hashPassword = function (password) {
    if (this.salt && password) {
        return crypto.pbkdf2Sync(password, new Buffer(this.salt, 'base64'), 10000, 64).toString('base64');
    } else {
        return password;
    }
};

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function (password) {
    return this.password === this.hashPassword(password);
};

/**
 * Register user model.
 */
mongoose.model('User', UserSchema);