const Product = require("../models/products");
const ErrorResponse = require("../utils/ErrorResponse");
const AsyncHandler = require("../middleware/async");
//const UploadFile = require("../middleware/uploadFile");

/**
 * @desc Get all Product
 * @route GET /api/v1/Products
 * @access public
 */
exports.getProducts = AsyncHandler(async (req, res, next) => {
  res.status(200).json(res.advanceResult);
});

/**
 * @desc Get single Product
 * @route GET /api/v1/products/:id
 * @access public
 */
exports.getProduct = AsyncHandler(async (req, res, next) => {
  let products = await Product.findById(req.params.id).populate("user");

  if (!products) {
    return next(
      new ErrorResponse(`Product not found with id ${req.params.id}`, 404)
    );
  }
  res.status(200).json({
    success: true,
    msg: "Get all Product",
    data: products,
  });
});

/**
 * @desc Create Product
 * @route POST /api/v1/products/
 * @access private
 */
exports.createProduct = AsyncHandler(async (req, res, next) => {
  req.body.user = req.user._id;
  let product = await Product.create(req.body);
  res.status(200).json({
    success: true,
    msg: "Added new product",
    data: product,
  });
});

/**
 * @desc Update Product
 * @route PUT /api/v1/products/:id
 * @access private
 */
exports.updateProduct = AsyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`Product not found with id ${req.params.id}`, 404)
    );
  }

  //check product ownership
  if (product.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorize to complete action`,
        404
      )
    );
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    msg: "Updated Product",
    data: product,
  });
});

/**
 * @desc Delete Product
 * @route DELETE /api/v1/products/:id
 * @access private
 */
exports.deleteProduct = AsyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`Product not found with id ${req.params.id}`, 404)
    );
  }

  //check product ownership
  if (product.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorize to complete action`,
        404
      )
    );
  }

  product.remove();

  res.status(200).json({
    success: true,
    msg: "Deleted Product",
    data: {},
  });
});
