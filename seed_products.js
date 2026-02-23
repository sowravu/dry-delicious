const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Product = require('./models/productsModel');
const Category = require('./models/CategoryModel');
const Brand = require('./models/brandModel');

const MONGO_URI = process.env.MONGODB_URI;

// Sample Data
const categories = [
    { categoryName: "Dry Fruits", Description: "Healthy and nutritious dry fruits" },
    { categoryName: "Nuts", Description: "Premium quality nuts" },
    { categoryName: "Spices", Description: "Aromatic spices" },
    { categoryName: "Seeds", Description: "Organic seeds" }
];

const brands = [
    { brandname: "DryDelicious Premium", description: "Our house brand", image: "" },
    { brandname: "NutriGold", description: "Gold standard nutrition", image: "" },
    { brandname: "Organic Harvest", description: "100% Organic", image: "" },
    { brandname: "Nature's Best", description: "From nature to you", image: "" }
];

const productNames = [
    "Premium Cashews", "Almonds", "Pistachios", "Walnuts", "Raisins",
    "Dates", "Figs", "Apricots", "Chia Seeds", "Flax Seeds",
    "Sunflower Seeds", "Pumpkin Seeds", "Cardamom", "Cinnamon", "Cloves"
];

const weights = ['250gm', '500gm', '1kg'];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Get Images
        const uploadsDir = path.join(__dirname, 'uploads');
        let images = [];
        try {
            images = fs.readdirSync(uploadsDir).filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
            console.log(`Found ${images.length} images in uploads.`);
        } catch (err) {
            console.error("Error reading uploads directory:", err.message);
            // Default usage if no images found, though unlikely given prior checks
            images = ["default.jpg"];
        }

        const getRandomImage = () => images[Math.floor(Math.random() * images.length)];

        // 2. Seed Categories
        let categoryDocs = [];
        const existingCategories = await Category.find();
        if (existingCategories.length === 0) {
            console.log("Seeding Categories...");
            categoryDocs = await Category.insertMany(categories);
        } else {
            console.log("Categories already exist. Using existing.");
            categoryDocs = existingCategories;
        }

        // 3. Seed Brands
        let brandDocs = [];
        const existingBrands = await Brand.find();
        if (existingBrands.length === 0) {
            console.log("Seeding Brands...");
            // Assign random image to brands
            brands.forEach(b => b.image = getRandomImage());
            brandDocs = await Brand.insertMany(brands);
        } else {
            console.log("Brands already exist. Using existing.");
            brandDocs = existingBrands;
        }

        // 4. Seed Products
        const productCount = await Product.countDocuments();
        if (productCount === 0) {
            console.log("Seeding Products...");
            const productDocs = [];

            for (let i = 0; i < 20; i++) {
                const randomCat = categoryDocs[Math.floor(Math.random() * categoryDocs.length)];
                const randomBrand = brandDocs[Math.floor(Math.random() * brandDocs.length)];
                const randomName = productNames[Math.floor(Math.random() * productNames.length)] + ` ${i + 1}`;

                // Assign 3 random images per product
                const pImages = [getRandomImage(), getRandomImage(), getRandomImage()];

                const product = new Product({
                    productname: randomName,
                    productDis: `This is a premium quality ${randomName}. Rich in nutrients and perfect for a healthy lifestyle.`,
                    productImage: pImages,
                    productCategory: randomCat._id,
                    productBrand: randomBrand._id,
                    is_delete: false,
                    weightoptions: [
                        { weight: '250gm', stock: 50, salesPrice: 500, Actualprice: 600 },
                        { weight: '500gm', stock: 50, salesPrice: 900, Actualprice: 1100 },
                        { weight: '1kg', stock: 50, salesPrice: 1700, Actualprice: 2000 }
                    ]
                });
                productDocs.push(product);
            }

            await Product.insertMany(productDocs);
            console.log(`Successfully seeded ${productDocs.length} products.`);
        } else {
            console.log(`Products already exist (${productCount}). Skipping product seeding.`);
        }

        console.log("Seeding Complete!");

    } catch (error) {
        console.error("Seeding Error:", error);
    } finally {
        mongoose.connection.close();
    }
}

seed();
