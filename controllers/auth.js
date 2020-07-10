const User = require("../models/user");
const TokenWhiteList = require("../models/tokens");
const ErrorResponse = require("../utils/ErrorResponse");
const AsyncHandler = require("../middleware/async");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const passport = require("passport");
const { sendTokenCookie, blacklistToken } = require("../utils/auth");
const sendEmail = require("../utils/mail");

/**
 * @desc Register user
 * @route GET /api/v1/auth/register
 * @access public
 */
exports.register = AsyncHandler(async (req, res, next) => {
  const { username, email, password, role } = req.body;

  //Create a new user
  const user = await User.create({
    username,
    email,
    password,
    role,
  });

  res.status(200).json({
    success: true,
  });

  //sendTokenCookie(user, 200, res);
});

/**
 * @desc Login user
 * @route GET /api/v1/auth/login
 * @access public
 */
exports.login = AsyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //Validate email and password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide email and password", 400));
  }

  //check for user if exist
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  // Check if password correct
  const isValid = await user.validatePassword(password);

  if (!isValid) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  sendTokenCookie(user, 200, res);
});

/* *
 * @desc Facebook login
 * @route GET /api/v1/auth/facebook
 * @acess public
 */
/* exports.facebook = () => {
  passport.authenticate("facebook", { session: false, scope: ["email"] });
}; */

/**
 * @desc Facebook login callback
 * @route GET /api/v1/auth/facebook/callback/
 * @acess public
 */
/* exports.facebookCb = AsyncHandler(async (req, res, next) => {
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: "/",
  }),
    function (req, res) {
      sendTokenCookie(req.user, 200, res);
    };
}); */

/**
 * @desc Gives user a new access token
 * @route GET /api/v1/auth/token
 * @access private
 */
exports.newAccessToken = AsyncHandler(async (req, res, next) => {
  const refreshToken = req.body.token;
  if (!refreshToken) return next(new ErrorResponse("Invalid", 401));

  let token = await TokenWhiteList.findOne({
    refreshToken: refreshToken,
  }).populate("user");

  if (!token) return next(new ErrorResponse("Token invalid", 403));

  if (token.blacklisted)
    return next(new ErrorResponse("Token blacklisted", 403));

  //verify the refresh token
  try {
    jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH_KEY);

    //create a new access token
    const newToken = jwt.sign(
      { id: token.user._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: process.env.JWT_EXPIRES,
      }
    );

    res.status(200).json({
      token: newToken,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorResponse("Unauthorised", 403));
  }
});

/**
 * @desc Get current user
 * @route GET /api/v1/auth/me
 * @access private
 */
exports.getMe = AsyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @desc Logout current user
 * @route GET /api/v1/auth/logout
 * @access private
 */
exports.logout = AsyncHandler(async (req, res, next) => {
  const refreshToken = req.body.token;

  if (!refreshToken) return next(new ErrorResponse("Invalid", 401));
  let token = await TokenWhiteList.findOne({
    refreshToken: refreshToken,
  }).populate("user");

  if (!token) return next(new ErrorResponse("Token invalid", 403));

  if (token.blacklisted) return next(new ErrorResponse("Logged Out", 403));
  try {
    jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH_KEY);

    let user = await User.findById(token.user._id);
    await user.update({ refreshToken: undefined });
    await token.update({ blacklisted: true });

    res.status(200).json({
      success: true,
      token: "",
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorResponse("Unauthorised", 403));
  }
});

/**
 * @desc Forget Password
 * @route GET /api/v1/auth/forgetPassword
 * @access public
 */
exports.forgetPassword = AsyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) return next(new ErrorResponse("Invalid email", 404));

  //Get reset token
  const resetToken = await user.getResetPassToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const url = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/resetPassword/${resetToken}`;

  const message = `We received a request to reset the password for the AWS account associated with this e-mail address. Click the link below to reset your password using our secure server:\n\n${url}\n\nIf clicking the link doesn't work, you can copy and paste the link into your web browser's address bar. You will be able to create a new password for your AWS account after clicking the link above.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Reset password",
      text: message,
    });

    res.status(200).json({
      success: true,
      msg: "Email sent",
    });
  } catch (error) {
    console.log(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse("Email couldn't be sent", 500));
  }
});

/**
 * @desc Reset Password
 * @route GET /api/v1/auth/resetPassword/:token
 * @access public
 */
exports.resetPassword = AsyncHandler(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) return next(new ErrorResponse("Invalid token", 404));

  //save new Password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  sendTokenCookie(user, 200, res);
});
