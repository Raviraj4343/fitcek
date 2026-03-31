import express from "express";
import { getAllFoods, searchFoods, getFoodById, getCategories } from "../controllers/food.controller.js";
import { protect } from "../middleware/auth.middleware.js";


// All food routes require authentication
router.use(protect);


router.get("/search", searchFoods);
router.get("/categories", getCategories);
router.get("/", getAllFoods);
router.get("/:id", getFoodById);

export default router;