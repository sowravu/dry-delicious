
const express=require("express");
const user_route=express()
const {userAuth,adminAuth}=require("../middleware/auth")
const userController = require("../controllers/user/userController");
const { Passport } = require("passport");
const passport=require("passport")

user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}));

user_route.set("view engine","ejs");
user_route.set("views","./views/user");
user_route.use(express.static("public/user"));


user_route.get("/",userController.loginload);
user_route.get("/home",userAuth,userController.loadHome)
user_route.post("/",userController.loginVerify)
user_route.get("/pageNotFound", userController.pageNotFound)
user_route.get("/shop",userAuth,userController.loadshop)
user_route.get("/logout",userController.logout)
user_route.get('/forget-password',userController.loadForgetPassword)
user_route.post('/forget-password',userController.ForgetPassword)
user_route.get('/reset-password/:token',userController.LoadUpdatePassword);
user_route.post('/reset-password',userController.UpdatePassword);
user_route.get('/profile',userAuth,userController.loadUserProfile);
user_route.post('/profile',userController.userProfile);
user_route.get("/address",userAuth,userController.loadAddress);
user_route.post("/address",userController.Address);
user_route.get("/edit-address",userAuth,userController.loadeditaddress);
user_route.post("/edit-address",userController.editaddress)
user_route.get("/register", userController.loadRegister);
user_route.post("/register", userController.register);
user_route.post("/verify-otp",userController.verifyOtp)
user_route.post("/resend-otp",userController.resendOTP)
user_route.post('/delete-address',userAuth,userController.deleteAddress)
user_route.get("/auth/google",passport.authenticate('google',{scope:['profile','email']}))

user_route.get("/product-details",userController.LoadproductDetails)
user_route.get("/cart",userController.loadCart)
user_route.post("/cart",userController.Addcart)
      

user_route.get("/auth/google/callback", passport.authenticate('google', { failureRedirect: "/" }), (req, res) => {
  if(req.user && req.user.isVerified){
    req.session.users = req.user;
    req.session.googleVarified=true
    res.redirect ('/home');
  }
  else{

    req.flash("error_msg","user is blocked by admin")

    res.redirect("/")
    
  }

});


module.exports = user_route;





