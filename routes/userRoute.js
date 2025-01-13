
const express=require("express");
const user_route=express()
const {userAuth,adminAuth,
  isLogout,isOrderplaced}=require("../middleware/auth")
const userController = require("../controllers/user/userController");
const orderController=require("../controllers/user/orderController")
const wishlistController=require("../controllers/user/wishlistController")
const WalletController=require("../controllers/user/WalletController")
const path=require("path")


const { Passport } = require("passport");
const passport=require("passport")
const upload=require("../middleware/multer")
user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}));

user_route.set("view engine","ejs");
user_route.set('views', path.join(__dirname, '../views/user'));
user_route.use(express.static("public/user"));


user_route.get("/",isLogout,userController.loginload);
user_route.get("/home",userAuth,userController.loadHome)
user_route.post("/",userController.loginVerify)
user_route.get("/pageNotFound", userController.pageNotFound)
user_route.get("/shop",userAuth,userController.loadshop)
user_route.get("/about",userAuth,userController.loadAbout)
user_route.get("/logout",userAuth,userController.logout)
user_route.get('/forget-password',userController.loadForgetPassword)
user_route.post('/forget-password',userController.ForgetPassword)
user_route.get('/reset-pass',userController.LoadresetPassword)
user_route.post('/reset-pass',userController.resetPassword)

user_route.get('/reset-password/:token',userController.LoadUpdatePassword);
user_route.post('/reset-password',userController.UpdatePassword);
user_route.get('/profile',userAuth,userController.loadUserProfile);
user_route.post('/profile',upload.single("image"),userController.userProfile);

user_route.get("/address",userAuth,upload.single("image"),userController.loadAddress);
user_route.post("/address",userController.Address);
user_route.get("/edit-address",userAuth,userController.loadeditaddress);
user_route.post("/edit-address",userAuth,userController.editaddress)
user_route.get("/register", userController.loadRegister);
user_route.post("/register", userController.register);
user_route.post("/verify-otp",userController.verifyOtp)
user_route.post("/resend-otp",userController.resendOTP)
user_route.post('/delete-address',userAuth,userController.deleteAddress)
user_route.get("/auth/google",passport.authenticate('google',{scope:['profile','email']}))


//cart  routes
user_route.get("/product-details",userAuth,userController.LoadproductDetails)
user_route.get("/cart",userAuth,userController.loadCart)
user_route.post("/cart",userAuth,userController.Addcart)
user_route.post("/delete-cart",userAuth,userController.deleteCart)
user_route.post("/update-cart-quantity",userController.increaseQty)

//checkout
user_route.get("/checkout",userAuth,userController.Loadcheckout)
user_route.post("/checkoutAddressAdd",userAuth,userController.checkoutAddaddress)
user_route.post("/checkoutAddressEdit",userAuth,userController.checkoutEditaddress)


//order
user_route.post("/orderComplete",userAuth,isOrderplaced,orderController.orderplaced)
user_route.get('/orders',userAuth,orderController.loadOrders)
user_route.get('/order-details',userAuth,orderController.loadOrderDetails)
user_route.get('/cancel-order/',userAuth,orderController.cancelOrder)
user_route.post("/verify-payment",userAuth,isOrderplaced,orderController.verifyRazorpayPayment)
user_route.get('/download-invoice',userAuth,orderController.generateInvoice)


//retry payment
user_route.post("/create-order",userAuth,orderController.razorpayCreateorder)
user_route.post("/verify-paymenttt",userAuth,isOrderplaced,orderController.verifyRetryRazorpayPayment)

//return order
user_route.post("/return-order",userAuth,orderController.returnOrder)

//wishlist
user_route.get("/wishlist",userAuth,wishlistController.loadWishlist)
user_route.post("/wishlist",userAuth,wishlistController.addwishlist)
user_route.delete("/wishlist", userAuth, wishlistController.addwishlist);
user_route.post("/wishlist",userAuth,wishlistController.addwishlist)
user_route.post("/wishlisttocart",userAuth,wishlistController.wishlistToCart)

//Wallet controller
user_route.get('/Wallet',userAuth,WalletController.loadWallet)
user_route.post('/create-razorpay-order', userAuth, WalletController.createOrder);
user_route.post('/verify-paymentt', userAuth, WalletController.verifyPayment);








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
























