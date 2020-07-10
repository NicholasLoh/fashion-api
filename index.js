const express = require("express");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/error");
const passport = require("passport");
const { Strategy } = require("passport-facebook");
const User = require("./models/user");

const router = express.Router();
//initialize app
const app = express();

//route files
const auth = require("./routes/auth");

//load env
dotenv.config({ path: "./config/config.env" });

//connect to mongoDB
connectDB();

//use body parser
app.use(express.json());

//use passport
app.use(passport.initialize());

passport.use(
  new Strategy(
    {
      clientID: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: "http://localhost:3000/api/v1/auth/facebook/callback",
      profileFields: ["id", "displayName", "photos", "email"],
    },
    async function (accessToken, refreshToken, profile, cb) {
      let user = await User.findOne({ facebookId: profile.id });
      if (!user) {
        user = User.create({
          username: profile.displayName,
          email: profile.emails[0].value,
          loginType: "facebook",
          facebookId: profile.id,
          profilePic: profile.photos[0].value,
        });

        console.log(user);

        return cb(null, user);
      }

      return cb(null, user);
    }
  )
);

const PORT = process.env.PORT || 3000;

const server = app.listen(
  PORT,
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
);

//mount auth router
app.use("/api/v1/auth", auth);

//use errorHandler
app.use(errorHandler);
app.use("/", (req, res) => {});

//Handle rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  //close server and exit
  server.close(() => {
    process.exit(1);
  });
});
