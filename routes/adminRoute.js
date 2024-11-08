const express=require("express");

const path = require("path");
const admin_route=express()
const upload=require("../middleware/multer")

const adminController=require("../controllers/admin/adminController")
const productController=require("../controllers/admin/productController")
const {userAuth,adminAuth}=require("../middleware/auth")

admin_route.use(express.json());
admin_route.use(express.urlencoded({extended:true}));


admin_route.set("view engine","ejs");
admin_route.set("views","./views/admin");
admin_route.use(express.static("public/admin"));

// Admin Authentication Routes 
admin_route.get("/login",adminController.loginload);
admin_route.get("/logout",adminController.adminLogout);
admin_route.post("/login",adminController.loginverify);

 
//Admin Dashboard

admin_route.get("/dashboard",adminAuth,adminController.loadDashboard);

 
// User Management 

admin_route.get("/users",adminAuth,adminController.usersload);
admin_route.get("/block",adminAuth,adminController.userblock);
admin_route.get("/unblock",adminAuth,adminController.userUnblock);


 //Category Management 

admin_route.get("/categories",adminAuth,adminController.categoriesload);
admin_route.post("/categories",adminAuth,adminController.addCategories);
admin_route.get("/edit-categories",adminAuth,adminController.loadeditCategories);
admin_route.post("/edit-categories",adminAuth,adminController.editCategories);
admin_route.get("/delete-categories",adminAuth,adminController.deleteCategories);

 //Brand Management 

admin_route.get("/brands",adminAuth,adminController.loadbrands);
admin_route.post("/brands",adminAuth,upload.single("image"),adminController.addbrand);
admin_route.get("/delete-brand",adminAuth,adminController.deleteBrand);
admin_route.get("/edit-brand",adminAuth,adminController.loadeditBrand);
admin_route.post("/edit-brand",adminAuth,upload.single("image"),adminController.editBrand);


 //Product Management

admin_route.get("/add-products",adminAuth,productController.loadAddProduct);
admin_route.post("/add-products", adminAuth,upload.array('productimage', 3), productController.addProduct);
admin_route.get("/products",adminAuth,productController.loadproducts)
admin_route.get("/edit-products",adminAuth,productController.loadEditProduct)
admin_route.post("/edit-products",adminAuth,upload.array('productimage', 3),productController.editProduct)
admin_route.get("/delete-product",adminAuth,productController.deleteProduct)


module.exports = admin_route;
