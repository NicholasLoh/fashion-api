const express = require("express");
const router = express.Router;

const {
  getProduct,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product");
const { protect, authorize } = require("../middleware/auth");
const advanceResult = require("../middleware/advanceResult");
//const { upload } = require("../middleware/uploadFile");

const Product = require("../models/products");

router
  .route("/")
  .get(advanceResult(Product, "user"), getProducts)
  .post(protect, createProduct);
router
  .route("/:id")
  .get(getProduct)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

module.exports = router;
