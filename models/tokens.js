const mongoose = require("mongoose");

const TokenSchema = mongoose.Schema({
  refreshToken: {
    type: String,
    require: [true, "Please add an refresh token"],
  },
  blacklisted: { type: "Boolean", default: false },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("TokenWhiteList", TokenSchema);
