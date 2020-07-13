const express = require("express");
const router = express.Router;

const {
  getPortfolio,
  getPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
} = require("../controllers/Portfolio");
const { protect, authorize } = require("../middleware/auth");
const advanceResult = require("../middleware/advanceResult");
const Portfolio = require("../models/portfolio");

router
  .route("/")
  .get(advanceResult(Portfolio, "user"), getPortfolios)
  .post(protect, createPortfolio);
router
  .route("/:id")
  .get(getPortfolio)
  .put(protect, updatePortfolio)
  .delete(protect, deletePortfolio);

module.exports = router;
