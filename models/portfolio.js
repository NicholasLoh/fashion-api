const mongoose = require("mongoose");

const PortfolioSchema = mongoose.Schema({
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  photo: [String],
  top: String,
  bottom: String,
  shoes: String,
  accessories: [String],
  /* Portfolios: {
    type: mongoose.Schema.ObjectId,
    ref: "Portfolio",
  }, */
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Portfolio", PortfolioSchema);
