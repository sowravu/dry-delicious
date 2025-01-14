const nodemailer = require("nodemailer");
require("dotenv").config();
const { generate } = require("randomstring");
const User = require("../../models/userModel");
const bcrypt = require("bcrypt");
const { text } = require("express");
const Product = require("../../models/productsModel");
const Brand = require("../../models/brandModel");
const Category = require("../../models/CategoryModel");
const address = require("../../models/addressModel");
const StatusCodes = require("../../utils/statusCodes");
const crypto = require("crypto");
const CartItem = require("../../models/cartModel");
const Wishlist=require("../../models/wishlistModel")
const coupon=require("../../models/coupenModel")

// page not found
const pageNotFound = async (req, res) => {
  try {
    return res.render("page-404");
  } catch (error) {
    return res.redirect("/pageNotFound");
  }
};

//login page render function
const loginload = async (req, res) => {
  try {
    if (!req.session.users) {
      return res.render("login");
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("login page is not loaded");
  }
};
const loginVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });

    if (userData) {
      const passMatch = await bcrypt.compare(password, userData.password);
      const isvarified = userData.isVerified;

      if (passMatch && isvarified === true) {
        req.session.users = userData;
        return res.redirect("/home");
      } else {
        return res.render("login", {
          message: "email or passsword is incorrect",
        });
      }
    } else {
      return res.render("login", { message: "user not found please sigin up" });
    }
  } catch (error) {
    console.error("error ", error);
    return res.redirect("/pageNotFound");
  }
};

const loadRegister = async (req, res) => {
  try {
    return res.render("register");
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("register page is not loaded");
  }
};

const loadHome = async (req, res) => {
  try {
    const user = req.session.users;
    const product = await Product.find({ is_delete: false });

    const brand = await Brand.find();
    if (user) {
      const userData = await User.findOne({ _id: user._id });
      return res.render("home", { user: userData, product, brand: brand });
    } else {
      return res.render("home", { product: product, brand: brand });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("home page is not loaded");
  }
};

const loadshop = async (req, res) => {
  try {
    const userdata = req.session.users;

    const currentpage = parseInt(req.query.page) || 1;

    const limit = parseInt(req.query.limit) || 8;

    const filter = { is_delete: false };

    const findwishlist = await Wishlist.findOne({ userId: userdata._id });

    const selectedCategories = req.query.category ? (Array.isArray(req.query.category) ? req.query.category : [req.query.category]) : [];

    
    const selectedBrands = req.query.brand ? (Array.isArray(req.query.brand) ? req.query.brand : [req.query.brand]) : [];

    const selectedSort = req.query.sort || '';

    const searchQuery = req.query.search || '';

    if (selectedCategories.length) {
      filter.productCategory = { $in: selectedCategories };
    }

    if (selectedBrands.length) {
      filter.productBrand = { $in: selectedBrands };
    }

    if (searchQuery) {
      filter.productname = { $regex: searchQuery, $options: 'i' };
    }

    let sortOption = {};
    
    if (selectedSort === "priceAsc") sortOption = { "weightoptions.salesPrice": 1 };

    if (selectedSort === "priceDesc") sortOption = { "weightoptions.salesPrice": -1 };

    if (selectedSort === "nameAsc") sortOption = { productname: 1 };

    if (selectedSort === "nameDesc") sortOption = { productname: -1 };

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(filter)
      .sort(sortOption)
      .skip((currentpage - 1) * limit)
      .limit(limit)
      .populate("productCategory")
      .populate("productBrand");

    const categories = await Category.find();
    const brand = await Brand.find();

    return res.render("shop", {
      findwishlist,
      products,
      categories,
      brand,
      currentpage,
      totalPages,
      selectedCategories,
      selectedSort,
      selectedBrands,
      searchQuery,
      limit
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to load shop page");
  }
};


const loadForgetPassword = async (req, res) => {
  try {
    return res.render("forget-password");
  } catch (error) {
    console.log(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("loading forget password faild");
  }
};

const ForgetPassword = async (req, res) => {
  const email = req.body.email;
  try {
    if (email) {
      const user = await User.findOne({ email: email });

      if (!user) {
        req.flash("error_msg", "Cannot find email. Please try again");
        res.redirect("/forget-password");
      }
      const token = crypto.randomBytes(32).toString("hex");

      user.resetPasswordToken = token;

      user.resetPasswordExpires = Date.now() + 3600000;

      await user.save();
      const resetPasswordLink = `${process.env.NODE_ENV==='production'?process.env.PRODUCTION_DOMAIN:'http://localhost:5678'}/reset-password/${token}`;

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,

        auth: {
          user: process.env.NODEMAILER_EMAIL,
          pass: process.env.NODEMAILER_PASSWORD,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.NODEMAILER_EMAIL,
        to: user.email,
        subject: "Password Reset Request",
        text: `You are receiving this because you (or someone else) requested the reset of the password for your account.\n\n
      ${resetPasswordLink}\n\n`,
      });
      console.log(resetPasswordLink);
      await transporter.sendMail(info);
      req.flash("success_msg", "Reset link sent to your email. Please check");
      res.redirect("/forget-password");
    }
  } catch (error) {
    console.log(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("Error in sending email");
  }
};

const LoadUpdatePassword = async (req, res) => {
  try {
    const token = req.params.token;

    return res.render("update-password", { token });
  } catch (error) {
    console.log(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("loading new password page falield");
  }
};

const UpdatePassword = async (req, res) => {
  const token = req.body.token.trim();
  const { newPassword } = req.body;

  try {
    console.log("update pass Token:", token);
    const userdata = await User.findOne({
      resetPasswordToken: token,
      resetPasswordToken: { $gt: Date.now() },
    });
    console.log("thsis is the user", userdata);
    if (!userdata) {
      req.flash("error_msg", "Password reset token is invalid or has expired.");
      return res.redirect("/");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    userdata.password = hashedPassword;
    userdata.resetPasswordToken = undefined;
    userdata.resetPasswordExpires = undefined;
    await userdata.save();
    req.flash("success_msg", "Password has been reset.");
    return res.redirect("/");
  } catch (error) {
    console.log(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("Error resetting password");
  }
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,

      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });
    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "veryfy your email",
      text: `your otp is ${otp}`,
      html: `<b>Your otp:${otp}</b>`,
    });
    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending mail", error);
    return false;
  }
}

const register = async (req, res) => {
  try {
    const { name, phone, email, password, cpassword } = req.body;
    if (password !== cpassword) {
      return res.render("register", { message: "password is does not match" });
    }
    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render("register", {
        message: "user with this email is already exists",
      });
    }
    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res.json("email-error");
    }
    req.session.userOtp = otp;
    console.log("otp sent", otp);
    req.session.userData = { name, phone, email, password };
    return res.render("otp");
  } catch (error) {
    console.error("singup error", error);
    return res.redirect("/pageNotFound");
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log(otp);
    if (otp === req.session.userOtp) {
      console.log("dddd", req.session.userOtp);
      const user = req.session.userData;
      const passwordhash = await securePassword(user.password);

      const saveUserData = await new User({
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: passwordhash,
        isVerified: true,
      });
      await saveUserData.save();
      req.session.user = saveUserData._id;
      return res.json({ success: true, redirectUrl: "/" });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP,Please try again" });
    }
  } catch (error) {
    console.error("Error verifying otp ", error);
    return res
      .status(500)
      .json({ success: false, message: "An orror occured" });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.session.userData;
    console.log(email);
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "email is not found in the session" });
    }
    const otp = generateOtp();
    console.log(otp);

    const emailSent = await sendVerificationEmail(email, otp);
    if (emailSent) {
      req.session.userOtp = otp;

      console.log("Resend OTP:", otp);
      return res
        .status(200)
        .json({ success: true, message: "otp resend successfully" });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to resend OTP.please try again",
      });
    }
  } catch (error) {
    console.error("Error resending OTP", error);
    return res.status(500).json({
      success: false,
      message: "internal server Error. please try again",
    });
  }
};
const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("faild to distory err");
        return res.redirect("/pageNotFound");
      }
    });
    return res.redirect("/");
  } catch (error) {
    console.log("logout error", error);
    return res.redirect("/pageNotFound");
  }
};
const LoadproductDetails = async (req, res) => {
  try {
    const id = req.query.id;
    const productDetails = await Product.findById({ _id: id });

    const relativeProducts = await Product.find({
      productCategory: productDetails.productCategory,
    });

    if (productDetails.is_delete == false && productDetails && productDetails.weightoptions) {
      return res.render("product-details", {
        product: productDetails,
        weightoptions: productDetails.weightoptions,
        relativeProducts: relativeProducts,
      });
    } else {
      return res.redirect("/pageNotFound")
    }
  } catch (error) {
    res.send("faild to load product details page");
    console.log(error);
  }
};

const loadUserProfile = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });

    if (userData) {
      return res.render("profile", { userData: userData });
    } else {
      res.send("finding user data faild");
    }
  } catch (error) {
    console.log(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("loading userProfile faield");
  }
};

const userProfile = async (req, res) => {
  try {
    const { name, phone  } = req.body;
    const userdata = req.session.users;
    const image = req.file ? req.file.filename : null

    const id = userdata._id.trim();
    const findUser = await User.findOne({ _id: id });
  
    if (findUser) {
      await User.findByIdAndUpdate(
        { _id: findUser._id },
        { $set: { name: name, phone: phone,Image:image } }
      );
      return res.redirect(`/profile?id=${id}`);
    } else {
      res.send("faield to update");
    }
  } catch (error) {
    console.log(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("updating userData faield");
  }
};

const loadAddress = async (req, res) => {
  try {
    const userdata = req.session.users;
    const data = await User.findById({ _id: userdata._id }).populate("address");
   
    if (address) {
      return res.render("address", { data: data });
    } else {
      res.send("not address here");
    }
  } catch (error) {
    console.log(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("loading addres page faield");
  }
};
const Address = async (req, res) => {
  try {
    const userdata = req.session.users;
    const { Fullname, Address, city, State, pinCode, Country, phone, addressType } =
      req.body;
  
    const saveAddress = await new address({
      Fullname: Fullname,
      Address: Address,
      city: city,
      State: State,
      pinCode: pinCode,
      Country: Country,
      phone: phone,
      addressType: addressType.toString()
    });
    await saveAddress.save();
    const id = userdata._id;
 
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $push: { address: saveAddress._id } },
      { new: true }
    );
    if (updatedUser) {
      return res.redirect("/address");
    }
  } catch (error) {
    console.log(error);
  }
};
const loadeditaddress = async (req, res) => {
  try {
    const id = req.query.id;
    req.session.addressId = id;

    const findAddress = await address.findById({ _id: id });

    return res.render("edit-address", { findAddress: findAddress });
  } catch (error) {
    console.log(error);
  }
};
const editaddress = async (req, res) => {
  try {
    const addressId = req.session.addressId;

    const { Fullname, Address, city, State, pinCode, Country, phone, addressType } =
      req.body;


    if (addressId) {
      await address.findByIdAndUpdate(
        { _id: addressId.trim() },
        {
          $set: {
            Fullname: Fullname,
            Address: Address,
            city: city,
            State: State,
            pinCode: pinCode,
            Country: Country,
            phone: phone,
            addressType: addressType
          },
        }
      );
    }

    return res.redirect(`/address`);
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("deleting failed");
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userdata = req.session.users;

    const id = req.query.id;
    if (id) {
      await address.findByIdAndDelete(id);
    }
    const findUser = await User.findByIdAndUpdate(
      { _id: userdata._id.trim() },
      { $pull: { address: id.trim() } },
      { new: true }
    );

    if (findUser) {
      return res.redirect("/address");
    }
  } catch (error) {
    console.log(error);
  }
};

const loadCart = async (req, res) => {
  try {
    const userdata = req.session.users;
    const cartdata = await CartItem.find({ userId: userdata._id });
    return res.render("cart", { cartdata: cartdata });
  } catch (error) {
    console.log(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("failed to loading cart page");
  }
};

const Addcart = async (req, res) => {
  try {
    const userdata = req.session.users;
    const id = req.query.id;
    const product = await Product.findById(id);
    const weight = req.body.curweight;
    const salesPrice = req.body.salesPrice;
    const stock = req.body.curstock;

    if (product) {
      const existingCartItem = await CartItem.findOne({
        userId: userdata._id,
        productId: id,
        size: weight,
      });

      if (existingCartItem) {

        const currentQty = existingCartItem.quantity;
        if (stock > currentQty && currentQty < 5) {
          await CartItem.findByIdAndUpdate(
            { _id: existingCartItem._id },
            { $set: { quantity: currentQty + 1 } }
          );
          req.session.message = {
            icon: "success",
            text: "Product added to cart successfully.",
          };
          return res.redirect(`/product-details?id=${id}`);
        } else {
          req.session.message = {
            icon: "error",
            text: "This product is out of stock or The maximum quantity reached",
          };
          return res.redirect(`/product-details?id=${id}`);
        }
      }
      if (stock > 0) {
        const saveCart = new CartItem({
          userId: userdata._id,
          productId: id,
          name: product.productname,
          size: weight,
          price: salesPrice,
          quantity: 1,
          image: product.productImage[0],
        });
        await saveCart.save();
        req.session.message = {
          icon: "success",
          text: "Product added to cart successfully.",
        };
        res.redirect(`/product-details?id=${id}`);
      } else {
        req.session.message = {
          icon: "error",
          text: "Sorry, this product is out of stock.",
        };

        return res.redirect(`/product-details?id=${id}`);
      }
    }
  } catch (error) {
    req.session.message = {
      icon: "error",
      text: "An error occurred. Please try again.",
    };

    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("error");
  }
};

const deleteCart = async (req, res) => {
  try {
    const id = req.query.id;
    if (id) {
      await CartItem.findByIdAndDelete(id);
    }

    req.session.message = {
      icon: "success",
      text: "Product removed successfully.",
    };

    res.redirect("/cart");
  } catch (error) {
    console.log(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("product removing faield");
  }
};

const increaseQty = async (req, res) => {
  const { productId, quantity, itemid, itemsize } = req.body;

  if (!itemid || !productId || !quantity || isNaN(quantity)) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }

  try {
    const productData = await Product.findOne({ _id: itemid });
    let itemStock = 0;
    for (let value of productData.weightoptions) {
      if (value.weight == itemsize) {
        itemStock = value.stock;
      }
    }

    if (itemStock < quantity) {
      return res.json({
        success: false,
        message: "Cannot update because the item will be out of stock",
        outOfStock: true,
      });
    }

    const updatedCart = await CartItem.findOneAndUpdate(
      { _id: productId },
      { quantity: quantity },
      { new: true }
    );

    if (updatedCart) {
      res.json({ success: true, cart: updatedCart, itemStock });
    } else {
      res.status(404).json({ success: false, message: "Cart item not found." });
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

const Loadcheckout = async (req, res) => {
  try {
    const coupons = await coupon.find({
      isActive: true,
      expirationDate: { $gte: new Date() },
    });
    const userdata = req.session.users;
    const cartdata = await CartItem.find({ userId: userdata._id });
    const data = await User.findById({ _id: userdata._id }).populate("address");

    let totalprice = 0;
    for (let i of cartdata) {
      totalprice += i.price * i.quantity;
    }

    
    const applicableCoupons = coupons.filter((coupon) => {
      return totalprice >= coupon.minimumPurchase;
    });

    if (cartdata && totalprice > 0) {
      return res.render("checkout", {
        data: data,
        cartdata: cartdata,
        totalprice: totalprice,
        userid: userdata._id,
        coupons: applicableCoupons, 
      });
    } else {
      return res.redirect("/pageNotFound");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


const checkoutAddaddress=async(req,res)=>{

  try {
    const userdata = req.session.users;
    const { Fullname, Address, city, State, pinCode, Country, phone, addressType } =
      req.body;
   
    const saveAddress = await new address({
      Fullname: Fullname,
      Address: Address,
      city: city,
      State: State,
      pinCode: pinCode,
      Country: Country,
      phone: phone,
      addressType: addressType.toString()
    });
    await saveAddress.save();
    const id = userdata._id;
   
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $push: { address: saveAddress._id } },
      { new: true }
    );
    if (updatedUser) {
      req.session.message = {
        icon: "success",
        text: "Address added successfully.",
      };
      return res.redirect("/checkout");
    }
  } catch (error) {
    console.log(error);
  }
 
}

const checkoutEditaddress=async(req,res)=>{
try {
    

    const { Fullname, Address, city, State, pinCode, Country, phone, addressType,addressId } =
      req.body;
console.log(addressId)
      console.log("the req.body is ",req.body)
    if (addressId) {
      await address.findByIdAndUpdate(
        { _id: addressId.trim() },
        {
          $set: {
            Fullname: Fullname,
            Address: Address,
            city: city,
            State: State,
            pinCode: pinCode,
            Country: Country,
            phone: phone,
            addressType: addressType
          },
        }
      );
    }
    req.session.message = {
      icon: "success",
      text: "Address edited successfully.",
    };
   return res.redirect("/checkout");
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("deleting failed");
  }
}


const LoadresetPassword=async(req,res)=>{
  try {
     
    return res.render("reset-pass")
      
  } catch (error) {
    console.log(error)
    
  }
}
const resetPassword=async(req,res)=>{
  try {
    const userdata = req.session.users;
    const finduser=await User.findById({_id:userdata._id});
    const {oldPassword,newPassword,confirmPassword}=req.body;
   if(finduser){
    const passMatch = await bcrypt.compare(oldPassword,userdata.password);

    if(passMatch && newPassword==confirmPassword ){
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
       await User.findByIdAndUpdate(
        userdata._id,
        { $set: { password: hashedPassword } },
        { new: true, runValidators: true } 
      );
      req.session.message = {
        icon: "success",
        text: "passaword updated successfully.",
      };
      return res.redirect(`/profile?id=${userdata._id}`)        
    }else{
      res.send("The old password is not match")
    }

   }

  } catch (error) {
    console.log(error)
  }
}
const  loadAbout=async(req,res)=>{
  try {
    return res.render("about")
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("error for loading about page")
  }
}


 

module.exports = {

  loadAbout,
  resetPassword,
  LoadresetPassword,
  checkoutEditaddress,
  checkoutAddaddress,
  Loadcheckout,
  increaseQty,
  deleteCart,
  Addcart,
  loadCart,
  deleteAddress,
  editaddress,
  loadeditaddress,
  Address,
  userProfile,
  loadAddress,
  loadUserProfile,
  UpdatePassword,
  LoadUpdatePassword,
  ForgetPassword,
  loadForgetPassword,
  LoadproductDetails,
  loadshop,
  logout,
  loginVerify,
  loadHome,
  resendOTP,
  verifyOtp,
  register,
  pageNotFound,
  loadRegister,
  loginload,
};
