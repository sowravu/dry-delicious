const Admin = require("../../models/userModel");
const Category=require("../../models/CategoryModel")
const Brand = require("../../models/brandModel");
const StatusCodes = require('../../utils/statusCodes');
const Order = require("../../models/orderModel");
const PDFDocument = require('pdfkit');
const bcrypt = require("bcrypt");
const ExcelJS = require("exceljs");
const Product = require("../../models/productsModel");
const { render } = require("../../routes/adminRoute");
const fs = require('fs');
const path = require('path');



// Admin Login Page Controller
const loginload = async (req, res) => {
  try {
    if (!req.session.adminId) {
      return res.status(200).render("admin-login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Login page could not be loaded");
  }
};

// Admin Dashboard Controller

const loadDashboard = async (req, res) => {
  try {
    const startDate = req.query.startDate;
const endDate = req.query.endDate;

    const admin = req.session.adminId;
    const filter = req.query.filter || "All";
    console.log("filter is", filter);

    if (!admin) {
      console.log("Admin session missing");
      return res.status(401).send("Unauthorized access");
    }

    const adminData = await Admin.findOne({ _id: admin });
    const now = new Date();
    
 
    let dateFilter = {};
    if (filter === "Today") {
      const startOfDay = new Date(now);
      console.log("start day is is ",startOfDay)
      startOfDay.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: startOfDay } };
    } else if (filter === "This Week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: startOfWeek } };
    } else if (filter === "Last Month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
    } else if (filter === "Yearly") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      dateFilter = { createdAt: { $gte: startOfYear } };
    }
    if (filter === "Custom") {
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the full day for the end date
        dateFilter = { createdAt: { $gte: start, $lte: end } };
      } else {
        return res.status(400).send("Please provide both start and end dates for the custom filter.");
      }
    }
    

    const baseQuery = {
      ...dateFilter,
      payment_status: "success",
      "items.order_status": "Delivered"
    };

   
    const orders = await Order.find(baseQuery).lean();
    const grandTotal = orders.reduce((total, order) => total + order.total_price, 0);
    const totalOrders = orders.length;

   
    const productSales = await Order.aggregate([
      { $match: baseQuery },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          count: { $sum: "$items.quantity" },
          name: { $first: "$items.name" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const productIds = productSales.map(p => p._id);
    const topProducts = await Product.find({ _id: { $in: productIds } })
      .populate("productCategory")
      .populate("productBrand")
      .lean();

    const enrichedProductSales = productSales.map(sale => {
      const product = topProducts.find(p => p._id.toString() === sale._id.toString());
      return {
        ...sale,
        categoryName: product?.productCategory?.categoryName || 'Unknown',
        brandName: product?.productBrand?.brandname || 'Unknown'
      };
    });

  
    const categorySales = await Order.aggregate([
      { $match: baseQuery },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.productCategory",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $group: {
          _id: "$category._id",
          categoryName: { $first: "$category.categoryName" },
          count: { $sum: "$items.quantity" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

   
    const brandSales = await Order.aggregate([
      { $match: baseQuery },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "brands",
          localField: "product.productBrand",
          foreignField: "_id",
          as: "brand"
        }
      },
      { $unwind: "$brand" },
      {
        $group: {
          _id: "$brand._id",
          brandName: { $first: "$brand.brandname" },
          count: { $sum: "$items.quantity" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    const productCount = await Product.countDocuments();
   
    return res.render("dashboard", {
      startDate,
      endDate,
      admin: adminData,
      orders,
      filter,
      grandTotal, 
      totalOrders,
      filtername: filter,
      topProducts: enrichedProductSales,
      categorySales,
      brandSales,
      productCount
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).send("Dashboard page could not be loaded");
  }
};



const getSalesData = async (req, res) => {
  try {
    const { filter, start, end } = req.query;
    console.log("Filter received:", filter);
    console.log("Custom date range:", start, end);

    let dateFilter = {};
    const now = new Date();

    switch (filter) {
      case 'daily':
       
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

       
        const yesterdayStart = new Date();
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);

        dateFilter = {
          createdAt: {
            $gte: yesterdayStart, 
            $lt: todayEnd 
          }
        };
        break;

      case 'monthly':
   
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        dateFilter = {
          createdAt: {
            $gte: monthStart,
            $lt: monthEnd
          }
        };
        break;

      case 'yearly':
   
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

        dateFilter = {
          createdAt: {
            $gte: yearStart,
            $lt: yearEnd
          }
        };
        break;

      case 'custom':
        
        if (start && end) {
          dateFilter = {
            createdAt: {
              $gte: new Date(start),
              $lt: new Date(end)
            }
          };
        } else {
          return res.status(400).json({ error: "Invalid custom date range" });
        }
        break;

      default:
        return res.status(400).json({ error: "Invalid filter type" });
    }

    console.log("Date filter applied:", dateFilter);

    const salesData = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          "items.order_status": "Delivered",
          payment_status: "success"
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalSales: { $sum: "$total_price" }
        }
      },
      { $sort: { _id: 1 } } 
    ]);

    console.log("Aggregated sales data:", salesData);

   
    const labels = salesData.map(item => item._id);
    const data = salesData.map(item => item.totalSales);

    console.log("Labels:", labels);
    console.log("Data:", data);

    res.json({ labels, data });
  } catch (error) {
    console.error("Sales Data Error:", error);
    res.status(500).json({ error: "Could not fetch sales data" });
  }
};




const downloadPDF = async (req, res) => {
  try {
    const admin = req.session.adminId;
    const filter = req.query.filter || "All";
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    console.log("startDate is",startDate)
    console.log("endDate",endDate)
    if (admin) {
      let dateFilter = {};
      const now = new Date();
      if (filter === "Today") {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        dateFilter = { createdAt: { $gte: startOfDay } };
      } else if (filter === "This Week") {
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);
        dateFilter = { createdAt: { $gte: startOfWeek } };
      } else if (filter === "Last Month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
      } else if (filter === "Yearly") {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        dateFilter = { createdAt: { $gte: startOfYear } };
      }else if (filter === "Custom" && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the full day for the end date
        dateFilter = { createdAt: { $gte: start, $lte: end } };
      } else if (filter === "Custom") {
        return res.status(400).send("Please provide both start and end dates for the custom filter.");
      }
      const orders = await Order.find({
        ...dateFilter,
        payment_status: "success",
        "items.order_status": "Delivered",
      }).lean();

      const reportsDir = "./public/admin/reports";
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 30 });
      const fileName = `sales_report_${filter.replace(/ /g, "_")}.pdf`;
      const filePath = `${reportsDir}/${fileName}`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

      doc.pipe(fs.createWriteStream(filePath));
      doc.pipe(res);

      // Header Section
      const logoPath = "public/user/assets/images/download (3)sdfsd.png";
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 20, { width: 80 });
      }
      doc
        .fontSize(20)
        .fillColor("#333")
        .text("Sales Report", 150, 20, { align: "center" })
        .moveDown();
      doc
        .fontSize(12)
        .fillColor("#555")
        .text(`Filter: ${filter}`, { align: "right" })
        .moveDown();

    
      doc
        .fontSize(10)
        .fillColor("#ffffff")
        .rect(50, doc.y, 500, 20)
        .fill("#4caf50")
        .stroke()
        .text("Order ID", 55, doc.y + 5, { width: 90 })
        .text("Product Name", 145, doc.y + 5, { width: 150 })
        .text("Date", 295, doc.y + 5, { width: 60, align: "center" })
        .text("Total", 355, doc.y + 5, { width: 60, align: "right" })
        .text("Payment Status", 415, doc.y + 5, { width: 85, align: "center" })
        .moveDown();

      
      doc.fillColor("#333");
      orders.forEach((order, index) => {
        const isEvenRow = index % 2 === 0;
        if (isEvenRow) {
          doc.fillColor("#f9f9f9").rect(50, doc.y, 500, 20).fill().stroke();
        } else {
          doc.fillColor("#ffffff").rect(50, doc.y, 500, 20).fill().stroke();
        }

        doc.fillColor("#333");
        doc.text(order.orderId, 55, doc.y + 5, { width: 90 });
        order.items.forEach((item) => {
          doc.text(`${item.name} (${item.quantity} x ${item.size})`, 145, doc.y + 5, { width: 150 });
        });
        doc.text(new Date(order.createdAt).toLocaleDateString(), 295, doc.y + 5, { width: 60, align: "center" });
        doc.text(`₹${order.total_price}`, 355, doc.y + 5, { width: 60, align: "right" });
        doc.text(order.payment_status, 415, doc.y + 5, { width: 85, align: "center" });
      });

      
      const grandTotal = orders.reduce((acc, curr) => acc + curr.total_price, 0);
      doc.moveDown().fontSize(14).fillColor("#000").text(`Grand Total: ₹${grandTotal}`, { align: "right" });

      
      doc
        .fontSize(10)
        .fillColor("#777")
        .text("Generated by DryDelicious Admin Panel", 50, doc.page.height - 30, { align: "center" });

      doc.end();
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Error generating PDF");
  }
};



const downloadExcel = async (req, res) => {
  try {
    const admin = req.session.adminId;
    const filter = req.query.filter || "All";
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    if (admin) {
      let dateFilter = {};
      const now = new Date();
      if (filter === "Today") {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        dateFilter = { createdAt: { $gte: startOfDay } };
      } else if (filter === "This Week") {
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);
        dateFilter = { createdAt: { $gte: startOfWeek } };
      } else if (filter === "Last Month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
      } else if (filter === "Yearly") {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        dateFilter = { createdAt: { $gte: startOfYear } };
      }else if (filter === "Custom") {
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Include the full day for the end date
          dateFilter = { createdAt: { $gte: start, $lte: end } };
        } else {
          return res.status(400).send("Please provide both start and end dates for the custom filter.");
        }
      }


      const orders = await Order.find({
        ...dateFilter,
        payment_status: "success",
        "items.order_status": "Delivered",
      }).lean();

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales Report");

     
      worksheet.columns = [
        { header: "Order ID", key: "orderId", width: 15 },
        { header: "Product Name", key: "productName", width: 30 },
        { header: "Date", key: "date", width: 15 },
        { header: "Total", key: "total", width: 10 },
        { header: "Payment Status", key: "paymentStatus", width: 15 },
      ];

     
      orders.forEach((order) => {
        order.items.forEach((item) => {
          worksheet.addRow({
            orderId: order.orderId,
            productName: `${item.name} (${item.quantity} x ${item.size})`,
            date: new Date(order.createdAt).toLocaleDateString(),
            total: order.total_price,
            paymentStatus: order.payment_status,
          });
        });
      });

     
      const grandTotal = orders.reduce((acc, curr) => acc + curr.total_price, 0);
      worksheet.addRow([]);
      worksheet.addRow({ total: `Grand Total: ₹${grandTotal}` });

      const reportsDir = "./public/admin/reports";
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      const fileName = `sales_report_${filter.replace(/ /g, "_")}.xlsx`;
      const filePath = `${reportsDir}/${fileName}`;

      await workbook.xlsx.writeFile(filePath);

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${fileName}`
      );
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

      res.download(filePath, (err) => {
        if (err) {
          console.error("Error downloading Excel file:", err);
          res.status(500).send("Error downloading Excel file");
        }
      });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).send("Error generating Excel");
  }
};



const usersload = async (req, res) => {
  try {

    let { page = 1, limit = 5 } = req.query;

   
    page = parseInt(page);
    limit = parseInt(limit);

    
    const skip = (page - 1) * limit;

    const userData = await Admin.find({ isAdmin: false })
      .skip(skip)
      .limit(limit);

    const totalUsers = await Admin.countDocuments({ isAdmin: false });

  
    const totalPages = Math.ceil(totalUsers / limit);

  
    return res.render("users", {
      user: userData,
      currentPage: page,
      totalPages: totalPages,
      limit: limit,
   
    });
  } catch (error) {
    console.log(error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("user page is not loaded");

  }
};



const categoriesload = async (req, res) => {
  try {
     let {page=1,limit=2}=req.query;

       page=parseInt(page)
            limit=parseInt(limit)

     const skip=(page-1)*limit;

     const data = await Category.find({})
     .skip(skip)

     .limit(limit)

const totalCategors=await Category.find().countDocuments()

const totalPages=Math.ceil(totalCategors/limit)
    return res.render("categories", { 
      data: data ,
      currentPage:page,
      totalPages:totalPages,
      limit:limit,
    });
  } catch (error) {
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("categories page is not loaded");
 
  }
};

const loadeditCategories = async (req, res) => {
  try {
    const id = req.query.id;
    const categoriesData = await Category.findById({ _id: id });
    return res.render("edit-categories", { data: categoriesData });
  } catch (error) {
    console.error("error", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Error updating category");

  }
};


const loadbrands = async (req, res) => {

  try {
  
    let {page=1,limit=2}=req.query;
    page=parseInt(page)
    limit=parseInt(limit)
    
    const skip=(page-1)*limit;
    
    const brandData = await Brand.find()
    .skip(skip).limit(limit)

    const  totalBrands=await Brand.find().countDocuments()

    const totalPages= Math.ceil(totalBrands/limit)
    res.render("brands", { 
      brandData: brandData,
      currentpage:page,
      totalPageCount:totalPages,
      limit:limit
     });
  } catch (error) {
    console.error("error", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("brands page is not loaded");

  }
};




const loginverify = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const adminData = await Admin.findOne({ email: email });

    if (!adminData) {
      res.render("admin-login", { message: "invalid user" });
    } else {
      const isAdmin = adminData.isAdmin;
      const passwordMatch = await bcrypt.compare(password, adminData.password);
      if (passwordMatch && isAdmin) {
        req.session.adminId = adminData._id;

        res.redirect("/admin/dashboard");
      } else {
        res.render("admin-login", { message: "invalid username or password" });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("brands page is not loaded");
  }
};




const userblock = async (req, res) => {
  try {
    const id = req.query.id;
    console.log()
  
    if (id) {
      await Admin.findByIdAndUpdate({_id:id}, { isVerified: false }); 
      res.redirect("/admin/users");
    } else {
      res.status(400).send("User ID is missing");
    }
  } catch (error) {
    console.error("Error in user blocking:", error);
    res.status(500).send("Internal Server Error");
  }
};



const userUnblock = async (req, res) => {
  try {
    const id = req.query.id;
    console.log("the email id pass",id)
    if (id) {
      await Admin.findByIdAndUpdate({_id:id}, { isVerified: true });
      res.redirect("/admin/users");
    } else {
      res.status(400).send("User ID is missing");
    }
  } catch (error) {
    console.error("Error in user unblocking:", error);
    res.status(500).send("Internal Server Error");
  }
};


const addCategories = async (req, res) => {
  try {
    
    const name = req.body.name?.trim();
    const Description = req.body.Description;
    const capitalizedName = name.toUpperCase();
    const categoriesData = await Category.findOne({ categoryName: capitalizedName });
    console.log("capitalizedName",capitalizedName)
    if (categoriesData) {
     req.flash("error_msg","category is already here")
     res.redirect("/admin/categories")
    } else {
      const savecategoriesData = await new Category({
        categoryName: capitalizedName,
        Description: Description,
        isDelete: false,
      });
      await savecategoriesData.save();
     req.flash('success_msg', 'Category added successfully.');
     return res.redirect("/admin/categories");
    }
  } catch (error) {
    console.log("err", error);
  }
};

// Edit Category Controller
const editCategories = async (req, res) => {
  try {
    const name = req.body.name?.trim();


    const Description = req.body.description;

    const id = req.body.id;
    const categoriesdata = await Category.findById({ _id: id });
    
   const exstingData=await Category.find({categoryName:name})
   console.log("exstingData is",exstingData)
    if (categoriesdata.categoryName==name&&categoriesdata._id==id) {
       await Category.findByIdAndUpdate(
          id,
        { $set: { categoryName: name, Description: Description } }
      );
      req.flash('success_msg', 'Category updated successfully.');
     return res.redirect("/admin/categories")
          
    }else if(exstingData.length==0){
      await Category.findByIdAndUpdate(
        id,
      { $set: { categoryName: name, Description: Description } }
    );
    req.flash('success_msg', 'Category updated successfully.');
    return res.redirect("/admin/categories")
    }else{
      req.flash("error_msg","already exists")
     return res.redirect("/admin/categories")
    }
      
  } catch (error) {
    console.error("updation failed", error);
    res.send("error for update");
  }
};

// Delete/Update Category Status Controller
const deleteCategories = async (req, res) => {
  try {
    const id = req.query.id;
    if (id) {
      const categoriesdata = await Category.findById({ _id: id });

      if (!categoriesdata) {
        return res.status(404).json({ message: "Category not found" });
      }
      const newStatus = categoriesdata.isDelete ? false : true;
      await Category.findByIdAndUpdate(id, { isDelete: newStatus });
      res.redirect("/admin/categories");
    } else {
      res.status(StatusCodes.BAD_REQUEST).send("ID is missing");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating category status", error });
  }
};

// Edit Brand Page Controller
const loadeditBrand = async (req, res) => {
  try {
    const id = req.query.id;
    const brandData = await Brand.findById({ _id: id });
    if (brandData) {
      return res.render("edit-brand", { data: brandData });
    } else {
      res.status(StatusCodes.NOT_FOUND).send("Brand not found");
    }
  } catch (error) {
    console.error("Error", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Failed to load edit page");
  }
};

// Add New Brand Controller
const addbrand = async (req, res) => {
  try {
    const brandname = req.body.name;
    const description = req.body.description;
    const image = req.file ? req.file.filename : null;

    const brandData = await Brand.findOne({brandname:brandname});

    if (brandData) {
      req.flash("error_msg","brand is already here")
      return res.redirect("/admin/brands")
    } 
      const brand = new Brand({
        brandname: brandname,
        description: description,
        image: image,
        isActive: true,
      });
       await brand.save();

        req.flash("success_msg","brand added sucessfully")
        return res.redirect("/admin/brands")
    
  } catch (error) {
    console.error(error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Error adding brand");
  }
};

// Delete/Update Brand Status Controller
const deleteBrand = async (req, res) => {
  try {
    const id = req.query.id;
    if (id) {
      const bransData = await Brand.findById({ _id: id });
     
      if (!bransData) {
        return res.status(StatusCodes.NOT_FOUND).send("Brand not found");
      }
      const newStatus = bransData.isActive ? false : true;
      await Brand.findByIdAndUpdate(id, { isActive: newStatus });
      res.redirect("/admin/brands");
    } else {
      res.status(StatusCodes.BAD_REQUEST).send("ID is missing");
    }
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Error deleting brand");
  }
};

// Edit Brand Controller
const editBrand = async (req, res) => {
  try {
    const name = req.body.brandname.trim();
    const Description = req.body.branddescription;
    const id = req.query.id;
    
    const brandData = await Brand.findById({ _id: id });
    const image = req.files ? req.files.filename : brandData.image;
     
    const  exisingBrand=await Brand.find({brandname:name})
      
    if (brandData.brandname==name &&brandData._id==id) {
            await Brand.findOneAndUpdate(
              { _id: id },
        { $set: { brandname: name, description: Description, image: image } }
      );

      req.flash("success_msg","updated sucessfully")
      return res.redirect("/admin/brands")

    }else if(exisingBrand.length==0){
      await Brand.findOneAndUpdate(
        id,
         { $set: { brandname: name, description: Description, image: image } }
       )
       req.flash("success_msg","updated sucessfully")
       return res.redirect("/admin/brands")

    }else{
      req.flash("error_msg","brand is already here")
      return res.redirect("/admin/brands")
    }
      
  } catch (error) {
    console.error("updation failed", error);
    res.send("error for update");
  }
};

const adminLogout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("error for destorying session");
        res.status(404).send("page not found");
      }
    });
    res.redirect("/admin/login");
  } catch (error) {
    console.log("erro for logout");
    res.send("error for logout");
  }
};

module.exports = {
  downloadExcel,
  downloadPDF,
  adminLogout,
  editBrand,
  loadeditBrand,
  deleteBrand,
  addbrand,
  loadbrands,
  deleteCategories,
  editCategories,
  loadeditCategories,
  addCategories,
  categoriesload,
  userUnblock,
  userblock,
  usersload,
  loginverify,
  loginload,
  loadDashboard,
  getSalesData,
};
