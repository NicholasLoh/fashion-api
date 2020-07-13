const Portfolio = require("../models/portfolio");
const ErrorResponse = require("../utils/ErrorResponse");
const AsyncHandler = require("../middleware/async");
//const UploadFile = require("../middleware/uploadFile");

/**
 * @desc Get all Portfolio
 * @route GET /api/v1/Portfolios
 * @access public
 */
exports.getPortfolios = AsyncHandler(async (req, res, next) => {
  res.status(200).json(res.advanceResult);
});

/**
 * @desc Get single Portfolio
 * @route GET /api/v1/Portfolios/:id
 * @access public
 */
exports.getPortfolio = AsyncHandler(async (req, res, next) => {
  let Portfolios = await Portfolio.findById(req.params.id).populate("user");

  if (!Portfolios) {
    return next(
      new ErrorResponse(`Portfolio not found with id ${req.params.id}`, 404)
    );
  }
  res.status(200).json({
    success: true,
    msg: "Get all Portfolio",
    data: Portfolios,
  });
});

/**
 * @desc Create Portfolio
 * @route POST /api/v1/Portfolios/
 * @access private
 */
exports.createPortfolio = AsyncHandler(async (req, res, next) => {
  req.body.user = req.user._id;
  let Portfolio = await Portfolio.create(req.body);
  res.status(200).json({
    success: true,
    msg: "Added new Portfolio",
    data: Portfolio,
  });
});

/**
 * @desc Update Portfolio
 * @route PUT /api/v1/Portfolios/:id
 * @access private
 */
exports.updatePortfolio = AsyncHandler(async (req, res, next) => {
  let Portfolio = await Portfolio.findById(req.params.id);

  if (!Portfolio) {
    return next(
      new ErrorResponse(`Portfolio not found with id ${req.params.id}`, 404)
    );
  }

  //check Portfolio ownership
  if (Portfolio.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorize to complete action`,
        404
      )
    );
  }

  Portfolio = await Portfolio.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    msg: "Updated Portfolio",
    data: Portfolio,
  });
});

/**
 * @desc Delete Portfolio
 * @route DELETE /api/v1/Portfolios/:id
 * @access private
 */
exports.deletePortfolio = AsyncHandler(async (req, res, next) => {
  let Portfolio = await Portfolio.findById(req.params.id);

  if (!Portfolio) {
    return next(
      new ErrorResponse(`Portfolio not found with id ${req.params.id}`, 404)
    );
  }

  //check Portfolio ownership
  if (Portfolio.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorize to complete action`,
        404
      )
    );
  }

  Portfolio.remove();

  res.status(200).json({
    success: true,
    msg: "Deleted Portfolio",
    data: {},
  });
});
