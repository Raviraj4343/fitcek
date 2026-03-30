import mongoose from "mongoose";
import { MEAL_TYPES, WATER_LEVELS } from "../constants/index.js";

const mealItemSchema = new mongoose.Schema(
  {
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    foodName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.5 },
    caloriesPerUnit: { type: Number, required: true },
    proteinPerUnit: { type: Number, required: true },
    totalCalories: { type: Number },
    totalProtein: { type: Number },
  },
  { _id: false }
);

mealItemSchema.pre("save", function (next) {
  this.totalCalories = parseFloat(
    (this.caloriesPerUnit * this.quantity).toFixed(1)
  );
  this.totalProtein = parseFloat(
    (this.proteinPerUnit * this.quantity).toFixed(1)
  );
  next();
});

const mealGroupSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(MEAL_TYPES),
      required: true,
    },
    items: [mealItemSchema],
  },
  { _id: false }
);

const dailyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
    },
    meals: [mealGroupSchema],
    totalCalories: {
      type: Number,
      default: 0,
    },
    totalProtein: {
      type: Number,
      default: 0,
    },
    waterIntake: {
      type: String,
      enum: Object.values(WATER_LEVELS),
    },
    sleepHours: {
      type: Number,
      min: 0,
      max: 24,
    },
    steps: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: true }
);

// Compound index: one log per user per day
dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

/**
 * Recalculate totals before saving
 */
dailyLogSchema.pre("save", function (next) {
  let totalCalories = 0;
  let totalProtein = 0;

  this.meals.forEach((mealGroup) => {
    mealGroup.items.forEach((item) => {
      const cal = (item.caloriesPerUnit || 0) * (item.quantity || 1);
      const prot = (item.proteinPerUnit || 0) * (item.quantity || 1);

      item.totalCalories = parseFloat(cal.toFixed(1));
      item.totalProtein = parseFloat(prot.toFixed(1));

      totalCalories += cal;
      totalProtein += prot;
    });
  });

  this.totalCalories = Math.round(totalCalories);
  this.totalProtein = parseFloat(totalProtein.toFixed(1));

  next();
});

const DailyLog = mongoose.model("DailyLog", dailyLogSchema);

export default DailyLog;