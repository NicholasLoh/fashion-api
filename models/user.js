const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please add an username"],
  },
  email: {
    type: String,
    match: [
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please add a valid email address",
    ],
    required: [true, "Please add an email"],
    unique: true,
  },
  password: {
    type: "String",
    required: [false, "Please enter password"],
    minlength: 8,
    select: false,
  },
  profilePic: { typle: "String", default: "" },
  role: {
    type: "String",
    enum: ["user", "chef"],
    default: "user",
  },
  facebookId: String,
  loginType: {
    type: "String",
    enum: ["local", "facebook", "google"],
    default: "local",
  },
  refreshToken: { type: "String", select: false },
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

//hash password
UserSchema.pre("save", async function (req, res, next) {
  console.log(this);
  //hash password
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

//sign with JWT and return token
UserSchema.methods.getSignedJwtToken = function () {
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });

  return token;
};

//match user entered password with hased password in db
UserSchema.methods.validatePassword = async function (enteredPassword) {
  console.log(this);
  const valid = await bcrypt.compare(enteredPassword, this.password);
  return valid;
};

//generate and hash reset passtoken
UserSchema.methods.getResetPassToken = async function (enteredPassword) {
  //generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  //hash token and set token field\
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //set expired
  this.resetPasswordExpiry = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
