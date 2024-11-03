const User = require("../models/userModel");

const userAuth = (req, res, next) => {

  if (req.session.users) {
    const user = req.session.users;
    User.findById(user._id)
      .then((data) => {
        if (data && data.isVerified) {
          next();
        } else {
          req.session.destroy((err)=>{
            if(err){
              console.log("faild to distory err")
              return res.redirect("/pageNotFound")
            }
          
          })
          return res.redirect("/")// check channunnath isvarified false akkumbol
        }
      })
      .catch((error) => {
        console.log("error of user auth middleware");
        return res.status(500).send("internal server error");
      });
  } else {
    res.redirect("/"); // session illathappol
  }
};




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

module.exports = { userAuth, adminAuth };








