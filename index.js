const env = require("dotenv").config();
const session = require("express-session");
const flash = require('connect-flash');
const passport = require("./config/passport");

const mongoose = require("mongoose");
const path = require("path");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("connectd to mongo");
  })
  .catch((err) => console.log("faild to conne"));

const express = require("express");
const app = express();
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    },
  })
);
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});
// Serve node_modules as static for SweetAlert2 access
app.use('/modules', express.static('node_modules'));
app.use(passport.initialize());
app.use(passport.session());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");

app.use("/", userRoute);
app.use("/admin", adminRoute);

//server connection
app.listen(process.env.PORT, () => {
  console.log(`server is running...... http://localhost:${process.env.PORT}  `);
});
