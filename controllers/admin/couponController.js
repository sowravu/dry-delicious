const Admin = require("../../models/userModel");
const Category=require("../../models/CategoryModel")
const Brand = require("../../models/brandModel");
const StatusCodes = require('../../utils/statusCodes');
const product = require("../../models/productsModel");
const Coupon = require("../../models/coupenModel");






const loadcoupon=async(req,res)=>{
    try {
        const findcoupon=await Coupon.find()
        return res.render("coupon",{coupons:findcoupon})
    } catch (error) {
        console.log(error)
    }
}



const generateCouponCode = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let couponCode = '';
    for (let i = 0; i < length; i++) {
        couponCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return couponCode;

};

const addcoupon = async (req, res) => {
    
    try {
       
        const { discountType, discountValue, minimumPurchase, usageLimit, expirationDate,maximumAmount } = req.body;

       
        let code = generateCouponCode();

        
        let existingCoupon = await Coupon.findOne({ code });
        while (existingCoupon) {
            code = generateCouponCode(); 
            existingCoupon = await Coupon.findOne({ code });
        }

        const expiry = new Date(expirationDate);
        if (expiry <= new Date()) {
            
        req.session.message = {
            icon: "error",
            text: "Expiration date must be in the future",
          };

          return res.redirect("/admin/coupon")
        }

        
        const newCoupon = new Coupon({
            code, 
            discountType,
            discountValue: parseFloat(discountValue),
            minimumPurchase: minimumPurchase ? parseFloat(minimumPurchase) : 0,
            maximumAmountdiscount:   maximumAmount ? parseFloat(maximumAmount) : 0,
            usageLimit: usageLimit ? parseInt(usageLimit) : 1,
            expirationDate: expiry,
        });

       
        await newCoupon.save();
                 

        req.session.message = {
            icon: "success",
            text: "Coupon created successfully",
          };

          return res.redirect("/admin/coupon")
       
       

    } catch (error) {
        console.error('Error creating coupon:', error);
        req.session.message = {
            icon: "error",
            text: "An error occurred while creating the coupon",
          };

          return res.redirect("/admin/coupon")
    }
};


const deletecoupon=async(req,res)=>{
    try {
         const id=req.query.id;
         if(id){
            const findcouponandDelete=await Coupon.findByIdAndDelete(id)
            req.session.message = {
                icon: "success",
                text: "coupon deleted sucessfully",
              };
    
              return res.redirect("/admin/coupon")
         }
       
        

    } catch (error) {
        console.log(error)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("error for deleteing  ")
    }
}




module.exports={
    addcoupon,
    loadcoupon,
    deletecoupon
}