const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const verificationCodeSchema = mongoose.Schema({
  name: 'string',
  code: 'string',
  createdAt: { type: Date, expires: 60 * 60 * 2, default: Date.now }
}, { timestamp: true })

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: 1
  },
  isVerified: {
    type: Boolean,
    required: true,
    default: true /// should be false.
  },
  emailVerificationString: verificationCodeSchema,
  // verificationCodeSchema,
  resetPasswordVerificationString: {
    type: mongoose.Schema.Types.ObjectId
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  hasTicketAccount: {
    type: Boolean,
    required: true,
    default: false
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    trim: true
  },
  pubKey: {
    type: String
  },
  label: {
    type: Array,
    required: true
  },
  userActivities: [
    {
      action: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date
      },
      device: {
        type: String
      },
      loginDeviceId: {},
      ip: {
        type: String
      }
    }
  ],
  // accounts: [
  //   {
  //     commercialName: {
  //       type: String
  //     },
  //     logo: {
  //       type: String
  //     },
  //     username: {
  //       type: String
  //     }
  //   }
  // ]
});

// This functions will execute if the password field is modified.
userSchema.pre("save", function(next) {
  var user = this;
  if (user.isModified("password")) {
    bcrypt.genSalt(Number(process.env.SALT_I), function(err, salt) {
      if (err) return next(err);
      bcrypt.hash(user.password, salt, function(err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

// This method compares the password which is stored in database and
// the password which the user entered. It is used in Login.
userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

const User = mongoose.model('User', userSchema)
const VerificationCode = mongoose.model('VerificationCode', verificationCodeSchema)

module.exports = { User, VerificationCode }
