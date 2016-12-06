
var path      = require('path'),
    validator = require('../validator'),
    crypto    = require('crypto'),
    mongoose  = require('mongoose'),
    Schema    = mongoose.Schema;

var validateLocalStrategyEmail = function (email) {
    return ((this.provider !== 'local' && !this.updated) || this.mobile || validator.isEmail(email));
};

var validateLocalStrategyMobile = function (mobile) {
    return ((this.provider !== 'local' && !this.updated) || this.email || validator.isMobilePhone(mobile, 'zh-CN'));
};

var UserSchema = new Schema({
        displayName            : {
            type: String,
            trim: true
        },
        email                  : {
            type     : String,
            unique   : true,
            sparse   : true,
            lowercase: true,
            trim     : true,
            validate : [validateLocalStrategyEmail, 'INVALID_EMAIL']
        },
        mobile                 : {
            type    : String,
            unique  : true,
            sparse  : true,
            trim    : true,
            validate: [validateLocalStrategyMobile, 'INVALID_MOBILE']
        },
        username               : {
            type     : String,
            unique   : true,
            required : true,
            lowercase: true,
            trim     : true
        },
        password               : {
            type   : String,
            default: '',
            index  : false
        },
        salt                   : {
            type: String
        },
        profileImageURL        : {
            type   : String,
            default: '',
            index  : false
        },
        provider               : {
            type    : String,
            default : 'local',
            required: 'Provider is required'
        },
        providerData           : {},
        additionalProvidersData: {},
        roles                  : [],
        updated                : {
            type: Date
        },
        created                : {
            type   : Date,
            default: Date.now
        },
        resetPasswordToken     : {
            type: String
        },
        resetPasswordExpires   : {
            type: Date
        },
        region                 : {
            type    : String,
            trim    : true,
            required: 'Please select your region.',
            default : process.env.TAG_AREA
        },
        activated              : {
            type   : Boolean,
            default: false
        },
        activeToken            : {
            type: String
        },
        activeExpires          : {
            type: Date
        }
    },
    {
        collection: 'users'
    }
);

/**
 * Hook a pre save method to hash the password
 */
UserSchema.pre('save', function (next) {
    if (this.password && this.isModified('password')) {
        this.salt     = crypto.randomBytes(16).toString('base64');
        this.password = this.hashPassword(this.password);
    }

    if (!this.displayName) {
        if (this.email) {
            this.displayName = this.email.substring(0, this.email.lastIndexOf('@'));
        } else {
            this.displayName = this.mobile;
        }
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
 * Find possible not used username
 */
UserSchema.statics.findUniqueUsername = function (username, suffix, callback) {
    var _this            = this;
    var possibleUsername = username.toLowerCase() + (suffix || '');

    _this.findOne({
        username: possibleUsername
    }, function (err, user) {
        if (!err) {
            if (!user) {
                callback(possibleUsername);
            } else {
                return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
            }
        } else {
            callback(null);
        }
    });
};

/**
 * Register user model.
 */
mongoose.model('User', UserSchema);