import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/index.js";
import { PORT } from "./constants.js";

dotenv.config();

const app = express();

app.get("/", (req, res) => {
	res.json({ status: "ok", message: "Server running" });
});

const start = async () => {
	await connectDB();

	app.listen(PORT, () => {
		console.log(`Server listening on port ${PORT}`);
	});
};

start().catch((err) => {
	console.error("Failed to start app:", err);
	process.exit(1);
});
