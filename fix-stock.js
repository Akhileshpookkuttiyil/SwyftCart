const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please ensure MONGODB_URI is set in your .env file.");
  process.exit(1);
}

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

async function migrateStock() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const result = await Product.updateMany(
      { $or: [{ stock: { $exists: false } }, { stock: 0 }] },
      { $set: { stock: 100 } }
    );

    console.log(`Successfully updated ${result.modifiedCount} products to have 100 stock.`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

migrateStock();
