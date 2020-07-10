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

//blacklist the current refresh token
exports.blacklistToken = AsyncHandler(async (refreshToken, res, next) => {
  let token = await TokenWhiteList.findOne({
    refreshToken: refreshToken,
  }).populate("user");

  if (!token) return next(new ErrorResponse("Token invalid", 403));

  if (token.blacklisted) return next(new ErrorResponse("Logged Out", 403));

  try {
    jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH_KEY);

    let user = await User.findById(token.user._id);

    //check if the user in the refresh token actually have this token
    if (user.refreshToken === refreshToken) {
      await user.update({ refreshToken: undefined });
      await token.update({ blacklisted: true });
    } else {
      return next(new ErrorResponse("Unauthorised", 403));
    }

    res.status(200).json({
      success: true,
      token: "",
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorResponse("Unauthorised", 403));
  }
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
