import mongoose from "mongoose";
import { DIET_PREFERENCES } from "../constants.js";

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Food name is required"],
      unique: true,
      trim: true,
    },
    nameHindi: {
      type: String,
      trim: true,
    },
    caloriesPerUnit: {
      type: Number,
      required: [true, "Calories is required"],
      min: 0,
    },
    proteinPerUnit: {
      type: Number,
      required: [true, "Protein is required"],
      min: 0,
    },
    carbsPerUnit: {
      type: Number,
      default: 0,
      min: 0,
    },
    fatsPerUnit: {
      type: Number,
      default: 0,
      min: 0,
    },
    fiberPerUnit: {
      type: Number,
      default: 0,
      min: 0,
    },
    calciumPerUnit: {
      type: Number,
      default: 0,
      min: 0,
    },
    vitamins: {
      type: [String],
      default: [],
    },
    unit: {
      type: String,
      required: true,
      // e.g. "piece", "cup", "100g", "glass"
    },
    category: {
      type: String,
      enum: [
        "grain",
        "protein",
        "dairy",
        "vegetable",
        "fruit",
        "carb",
        "beverage",
        "snack",
        "other",
      ],
      default: "other",
    },
    dietType: {
      type: String,
      enum: [
        DIET_PREFERENCES.VEG,
        DIET_PREFERENCES.NON_VEG,
        DIET_PREFERENCES.MIXED,
      ],
      default: DIET_PREFERENCES.VEG,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Text search index
foodSchema.index({ name: "text", nameHindi: "text" });

const Food = mongoose.model("Food", foodSchema);

export default Food;
