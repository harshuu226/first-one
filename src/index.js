import dotenv from "dotenv";
dotenv.config();

import { app } from "./app.js";
import connectDB from "./db/index.js";
import { DB_NAME } from "./constants.js";



// Define and start server
const startServer = async () => {
  try {
    await connectDB(process.env.MONGODB_URL, DB_NAME);
    console.log("✅ MongoDB connected successfully");

    app.listen(process.env.PORT, () => {
      console.log("🚀 Server running on http://localhost:3000");
    });
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
};

// Call the function
startServer();



     