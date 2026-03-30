import mongoose from "mongoose";
import { DB_NAME, MONGODB_URI } from "../constants.js";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log("MongoDB already connected");
    return;
  }

  try {
    const uri = `${MONGODB_URI.replace(/\/$/, "")}/${DB_NAME}`;
    const connectionInstance = await mongoose.connect(uri);

    isConnected = true;
    console.log(`\n✅ MongoDB connected! Host: ${connectionInstance.connection.host}\n`);

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
      isConnected = false;
    });
  } catch (error) {
    console.error("❌ MongoDB connection FAILED:", error.message);
    process.exit(1);
  }
};

export default connectDB;