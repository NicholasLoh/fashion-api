const mongoose = require("mongoose");

const ProductSchema = mongoose.Schema({
  designer: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  name: {
    type: "String",
    max: 255,
    required: [true, "Please enter a product name"],
  },
  photo: [String],
  category: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", ProductSchema);
