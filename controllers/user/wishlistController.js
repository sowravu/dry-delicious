const CartItem = require("../../models/cartModel");
const User = require("../../models/userModel");
const Brand = require("../../models/brandModel");
const Category = require("../../models/CategoryModel");
const address = require("../../models/addressModel");
const Product = require("../../models/productsModel");
const StatusCodes = require("../../utils/statusCodes")
const Order = require("../../models/orderModel")
const env =require("dotenv").config();
const crypto = require('crypto');
const Razorpay = require('razorpay');;
const razorpay=require("../../config/Razorpay");
const Wishlist=require("../../models/wishlistModel")



const loadWishlist=async (req,res)=>{
    try {
      const userdata = req.session.users;
      const wishlistData = await Wishlist.findOne({ userId: userdata._id })
            .populate({
                path: 'products.productId', 
                model: 'product' 
            });


         return res.render("wishlist",{wishlist:wishlistData}) 
        
    } catch (error) {
        console.log(error)
        
    }
}

const addwishlist = async (req, res) => {
  try {
    const userdata = req.session.users;
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ userId: userdata._id });

    if (req.method === "POST") {
     
      if (!wishlist) {
        wishlist = new Wishlist({ userId: userdata._id, products: [{ productId }] });
      } else { 
        const alreadyExists = wishlist.products.some(item => item.productId.toString() === productId);
        if (!alreadyExists) {
          wishlist.products.push({ productId });
        }
      }
      await wishlist.save();
      return res.status(StatusCodes.OK).json({ message: 'Product added to wishlist' });

    } else if (req.method === "DELETE") {
      console.log("req.method is",req.method)
      if (wishlist) {
       
        wishlist.products = wishlist.products.filter(item => item.productId.toString() !== productId);
        await wishlist.save();
      }
      return res.status(StatusCodes.OK).json({ message: 'Product removed from wishlist' });
    }

    res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid request method' });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error updating wishlist' });
  }
};
const wishlistToCart=async (req,res)=>{

  try {
    const userdata = req.session.users;

    const { productId, selectedWeight, salesPrice, stock } = req.body;
    const product = await Product.findById(productId);
    if (product) {
      const existingCartItem = await CartItem.findOne({
        userId: userdata._id,
        productId:productId,
        size: selectedWeight,
      });

      if (existingCartItem) {

        const currentQty = existingCartItem.quantity;
        if (stock > currentQty && currentQty < 5) {
          await CartItem.findByIdAndUpdate(
            { _id: existingCartItem._id },
            { $set: { quantity: currentQty + 1 } }
          );
          return res.json({
            icon: "success",
            text: "Product added to cart successfully.",
          });
        } else {
          return res.json({
            icon: "error",
            text: "This product is out of stock or the maximum quantity is reached.",
          });
          
        }
      }
      if (stock > 0) {
        const saveCart = new CartItem({
          userId: userdata._id,
          productId: productId,
          name: product.productname,
          size: selectedWeight,
          price: salesPrice,
          quantity: 1,
          image: product.productImage[0],
        });
        await saveCart.save();
        return res.json({
          icon: "success",
          text: "Product added to cart successfully.",
        });
      } else {
        return res.json({
          icon: "error",
          text: "Sorry, this product is out of stock.",
        });

      
      }
    }
  } catch (error) {
    console.log(error);
    return res.json({
      icon: "error",
      text: "An error occurred. Please try again.",
    });
    
  }
}
const deleteWishlistItem=async(req,res)=>{
  try {
    const { wishlistId, productId }=req.query;
    await Wishlist.updateOne(
      { _id: wishlistId },
      { $pull: { products: { productId } } } 
  );
  req.session.message = {
    icon: "success",
    text: `product removed successfully`,
  };
  
   return res.redirect("/wishlist");
  } catch (error) {
    console.log("Error deleting wishlist item:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error")
  }
}


module.exports={
  deleteWishlistItem,
    wishlistToCart,
    loadWishlist,
    addwishlist
}