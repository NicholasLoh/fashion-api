const express = require("express");
const router = express.Router();
const passport = require("passport");
const {
  register,
  login,
  facebook,
  facebookCb,
  logout,
  getMe,
  newAccessToken,
  forgetPassword,
  resetPassword,
} = require("../controllers/auth");
const { protect } = require("../middleware/auth");
const { sendTokenCookie } = require("../utils/auth");

router.post("/register", register);
router.post("/login", login);
router.get(
  "/facebook",
  passport.authenticate("facebook", { session: false, scope: ["email"] })
);
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    //successRedirect: "/api/v1/auth/me",
    failureRedirect: "/login",
  }),
  function (req, res) {
    sendTokenCookie(req.user, 200, res);
  }
);
router.post("/forgetPassword", forgetPassword);
router.post("/resetPassword/:resettoken", resetPassword);
router.post("/logout", logout);
router.post("/token", newAccessToken);
router.get("/me", protect, getMe);

module.exports = router;
