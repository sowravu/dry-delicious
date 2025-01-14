require("dotenv").config();
const session = require("express-session");
const flash = require('connect-flash');
const passport = require("./config/passport");


const mongoose = require("mongoose");
const path = require("path");

const MONGO_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error.message);
  });



const express = require("express");
const app = express();


const preventCacheMiddleware = (req, res, next) => {

  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();

};


app.use(preventCacheMiddleware);

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

app.use((req, res, next) => {
  res.locals.message = req.session.message;
  delete req.session.message; 
  next();
});

app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

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

