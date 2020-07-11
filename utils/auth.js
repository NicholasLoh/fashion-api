/**
 * A controller to handle all authentication services eg.Create and update refresh token
 */
const User = require("../models/user");
const TokenWhiteList = require("../models/tokens");
const ErrorResponse = require("../utils/ErrorResponse");
const AsyncHandler = require("../middleware/async");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

//get token form modle and create cookie
exports.sendTokenCookie = AsyncHandler(async (user, statusCode, res) => {
  //create token
  const token = user.getSignedJwtToken();

  //get new refresh token
  let refreshToken = reqRefreshToken(user);

  //add refresh token to white list
  await TokenWhiteList.create({
    refreshToken,
    user: user._id,
  });

  await User.findByIdAndUpdate(user._id, { refreshToken });

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    token,
  });

  //res.redirect("http://localhost:5000/api/v1/auth/me");
});

//create a new refresh token
const reqRefreshToken = (user) => {
  //create refresh token
  const refreshToken =
    user._id.toString() + crypto.randomBytes(40).toString("hex");

  const signedToken = jwt.sign(
    {
      refreshToken,
      id: user._id,
    },
    process.env.JWT_SECRET_REFRESH_KEY,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES,
    }
  );

  return signedToken;
};
