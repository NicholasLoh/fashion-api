const jwt = require("jsonwebtoken");
//const passport = require("passport");
//const passportJwt = require("passport-jwt");
const AsyncHandler = require("./async");
const ErrorResponse = require("../utils/ErrorResponse");
const User = require("../models/user");

exports.protect = AsyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  //if token existe
  if (!token) {
    return next(new ErrorResponse("Not authorization to access route", 401));
  }

  //verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new ErrorResponse("Session expired", 440));
    } else {
      return next(new ErrorResponse("Not authorized", 401));
    }
  }
});
