import User from "../models/User.model";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "express-async-handler";
import { calculateBMI, calculateDailyCalories, calculateDailyProtein } from "../utils/healthUtils.js";


const setupProfile = asyncHandler(async (req, res) => {
  const {
    age,
    gender,
    heightCm,
    weightKg,
    bodyFatPercent,
    goal,
    activityLevel,
    dietPreference,
  } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      age,
      gender,
      heightCm,
      weightKg,
      bodyFatPercent,
      goal,
      activityLevel,
      dietPreference,
      profileCompleted: true,
    },
    { new: true, runValidators: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile set up successfully! Let's start tracking 🚀"));
});


const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    "age",
    "gender",
    "heightCm",
    "weightKg",
    "bodyFatPercent",
    "goal",
    "activityLevel",
    "dietPreference",
    "name",
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No valid fields provided for update.");
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile updated successfully."));
});


const getHealthStats = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user.profileCompleted) {
    throw new ApiError(403, "Please complete your profile first.");
  }

  const { bmi, category, message } = calculateBMI(user.weightKg, user.heightCm);
  const requiredCalories = calculateDailyCalories(user);
  const requiredProtein = calculateDailyProtein(user.weightKg, user.goal);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bmi,
        bmiCategory: category,
        bmiMessage: message,
        requiredCalories,
        requiredProtein,
        goal: user.goal,
        activityLevel: user.activityLevel,
        dietPreference: user.dietPreference,
      },
      "Health stats fetched."
    )
  );
});


const getProfile = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Profile fetched."));
});

export default  { setupProfile, updateProfile, getHealthStats, getProfile };