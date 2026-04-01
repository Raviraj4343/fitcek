import Food from "../models/food.model.js";
import FoodData from "../data/foods.js";
import asyncHandler from "../utils/AsyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

const escapeRegex = (text = "") => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const filterStaticFoods = ({ diet, category, q }) => {
  let items = FoodData;

  if (diet === "veg") {
    items = items.filter((item) => item.dietType === "veg");
  }

  if (category) {
    items = items.filter((item) => item.category === category);
  }

  if (q) {
    const term = q.toLowerCase();
    items = items.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      const nameHindi = String(item.nameHindi || "").toLowerCase();
      return name.includes(term) || nameHindi.includes(term);
    });
  }

  return items;
};


const getAllFoods = asyncHandler(async (req, res) => {
  const { diet, category } = req.query;

  const filter = { isActive: true };

  if (diet) {
    // veg users see only veg; non_veg/mixed see all
    if (diet === "veg") {
      filter.dietType = "veg";
    } else {
      filter.dietType = { $in: ["veg", "non_veg", "mixed"] };
    }
  }

  if (category) {
    filter.category = category;
  }

  let foods = await Food.find(filter).sort({ category: 1, name: 1 }).lean();

  // Fallback for environments where seeding has not run yet.
  if (!foods.length) {
    foods = filterStaticFoods({ diet, category });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, foods, "Foods fetched successfully."));
});


const searchFoods = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) {
    throw new ApiError(400, "Search query is required.");
  }

  const term = q.trim();
  const safeRegex = new RegExp(escapeRegex(term), "i");

  let foods = await Food.find({
    isActive: true,
    $or: [
      { name: safeRegex },
      { nameHindi: safeRegex },
    ],
  })
    .limit(10)
    .lean()
    .select(
      "name nameHindi unit caloriesPerUnit proteinPerUnit carbsPerUnit fatsPerUnit fiberPerUnit calciumPerUnit vitamins category dietType"
    );

  if (!foods.length) {
    foods = filterStaticFoods({ q: term }).slice(0, 10);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, foods, "Search results."));
});


const getFoodById = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.id);
  if (!food || !food.isActive) {
    throw new ApiError(404, "Food item not found.");
  }

  return res.status(200).json(new ApiResponse(200, food, "Food item fetched."));
});


const getCategories = asyncHandler(async (req, res) => {
  let categories = await Food.distinct("category", { isActive: true });

  if (!categories.length) {
    categories = [...new Set(FoodData.map((item) => item.category))];
  }

  return res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories fetched."));
});

export { getAllFoods, searchFoods, getFoodById, getCategories };
