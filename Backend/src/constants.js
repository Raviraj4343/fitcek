import dotenv from "dotenv";

dotenv.config();

export const DB_NAME = process.env.DB_NAME || "aqtev";
export const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || "mongodb://localhost:27017";
export const PORT = process.env.PORT || 3000;

// helpful debug: show which Mongo URI source is used when starting
if (process.env.MONGODB_URI) {
	console.log("Using MONGODB_URI from environment");
} else if (process.env.MONGODB_URL) {
	console.log("Using MONGODB_URL from environment");
} else {
	console.log("No Mongo env var found — using local mongodb://localhost:27017");
}

export default {
	DB_NAME,
	MONGODB_URI,
	PORT,
};
