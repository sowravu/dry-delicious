const User = require("../models/userModel");
const CartItem = require("../models/cartModel");
const { find } = require("../models/cartModel");
const userAuth = (req, res, next) => {

  if (req.session.users) {
    const user = req.session.users;
    User.findById(user._id)
      .then((data) => {
        if (data && data.isVerified) {
          next();
        } else {
          req.session.destroy((err) => {
            if (err) {
              console.log("faild to distory err")
              return res.redirect("/pageNotFound")
            }

          })
          return res.redirect("/")
        }
      })
      .catch((error) => {
        console.log("error of user auth middleware");
        return res.status(500).send("internal server error");
      });
  } else {
    res.redirect("/"); 
  }
};




const isLogout = async (req, res, next) => {
  try {
    if (req.session.users) {
      return res.redirect("/home")
    }
    next()
  } catch (error) {
    console.log(error.message);
  }
}


const adminAuth = (req, res, next) => {
  if (req.session.adminId) {
    User.findById(req.session.adminId)
      .then((data) => {
        if (data && data.isAdmin) {
          next();
        } else {
          res.redirect("/admin/login");
        }
      })
      .catch((error) => {
        console.log("error of admin auth middleware");
        return res.status(500).send("internal server error");
      });
  } else {
    return res.redirect("/admin/login");
  }
};


const isOrderplaced = async (req, res, next) => {
  if (req.session.users) {
    const userId = req.session.users._id;

    try {
      
      const cart = await CartItem.findOne({ userId: userId });

      
      if (!cart) {
        return res.redirect('/orderComplete');
      }

      
      next();
    } catch (err) {
      return res.status(500).send("Error fetching cart items.");
    }
  } else {
    return res.redirect('/'); 
  }
};




module.exports = {
  userAuth, adminAuth,
  isLogout,isOrderplaced
};








