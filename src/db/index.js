import mongoose from "mongoose";

const connectDB = async (MONGODB_URL, DB_NAME) => {
  try {
    const connectionInstance = await mongoose.connect(`${MONGODB_URL}/${DB_NAME}`);
    console.log(`✅ MongoDB connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;



