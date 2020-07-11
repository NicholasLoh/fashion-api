const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect, authorize } = require("../middleware/auth");

const { upload } = require("../controllers/utils");

router.post(
  "/uploadPhotos",
  protect,
  multer({ dest: "public/" }).array("photos"),
  upload
);

module.exports = router;
