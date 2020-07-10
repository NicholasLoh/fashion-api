const ErrorHandler = require("../utils/ErrorResponse");

const errorHandler = (err, req, res, next) => {
  //log error
  console.log(err);

  //copy whole error object
  let error = { ...err };

  let errMessage = "";
  error.message = err.message;

  //mongoose bad object id error
  if (err.name === "CastError") {
    //set specific error message
    errMessage = `Error retrieving recipe with id ${err.value}`;
    error = new ErrorHandler(errMessage, 404);
  }

  //mongoose duplicate key error
  if (err.code === 11000) {
    if (err.keyPattern.email) {
      errMessage = "Email Duplicate";
    }

    error = new ErrorHandler(errMessage, 400);
  }
  //mongoose validation error
  if (err.name == "ValidationError") {
    errMessage = Object.values(err.errors).map((val) => val.message);
    error = new ErrorHandler(errMessage, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server error",
  });
};

module.exports = errorHandler;
