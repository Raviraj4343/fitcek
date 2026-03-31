import asyncHandler from "express-async-handler";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { calculateBMI, calculateDailyCalories, calculateDailyProtein } from "../utils/calculations.js";
import { generateInsights } from "../utils/insights.js";
import DailyLog from "../models/DailyLog.js";

const getTodayIST = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });


const getTodayInsight = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user.profileCompleted) {
    throw new ApiError(403, "Please complete your profile to get insights.");
  }

  // ── 1. Compute requirements ──
  const { bmi, category: bmiCategory, message: bmiMessage } = calculateBMI(
    user.weightKg,
    user.heightCm
  );
  const requiredCalories = calculateDailyCalories(user);
  const requiredProtein = calculateDailyProtein(user.weightKg, user.goal);

  // ── 2. Fetch today's log ──
  const today = getTodayIST();
  const dailyLog = await DailyLog.findOne({ userId: user._id, date: today });

  const logData = dailyLog || {
    totalCalories: 0,
    totalProtein: 0,
    waterIntake: null,
    sleepHours: null,
    steps: null,
  };

  // ── 3. Generate insights ──
  const { insights, suggestions, warnings } = generateInsights({
    dailyLog: logData,
    requiredCalories,
    requiredProtein,
    bmiCategory,
    goal: user.goal,
    dietPreference: user.dietPreference,
  });

  // ── 4. Calorie / protein gap ──
  const calorieDiff = (logData.totalCalories || 0) - requiredCalories;
  const proteinGap = requiredProtein - (logData.totalProtein || 0);

  const response = {
    date: today,
    user: {
      name: user.name,
      goal: user.goal,
      dietPreference: user.dietPreference,
    },
    bmi: {
      value: bmi,
      category: bmiCategory,
      message: bmiMessage,
    },
    requirements: {
      calories: requiredCalories,
      protein: requiredProtein,
    },
    today: {
      calories: logData.totalCalories || 0,
      protein: logData.totalProtein || 0,
      waterIntake: logData.waterIntake || "Not logged",
      sleepHours: logData.sleepHours ?? "Not logged",
      steps: logData.steps ?? "Not logged",
      logExists: !!dailyLog,
    },
    gaps: {
      calories: calorieDiff,
      calorieStatus:
        calorieDiff > 200 ? "over" : calorieDiff < -200 ? "under" : "on_track",
      protein: proteinGap,
      proteinStatus: proteinGap > 10 ? "low" : proteinGap < -5 ? "excess" : "sufficient",
    },
    insights,
    suggestions,
    warnings,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Today's insights generated."));
});


const getWeeklySummary = asyncHandler(async (req, res) => {
  const user = req.user;
  const days = Math.min(parseInt(req.query.days) || 7, 30);

  const dates = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
  }

  const logs = await DailyLog.find({
    userId: user._id,
    date: { $in: dates },
  });

  if (logs.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, { message: "No logs found for this period." }, "No data."));
  }

  const requiredCalories = calculateDailyCalories(user);
  const requiredProtein = calculateDailyProtein(user.weightKg, user.goal);

  const totalCalories = logs.reduce((sum, l) => sum + (l.totalCalories || 0), 0);
  const totalProtein = logs.reduce((sum, l) => sum + (l.totalProtein || 0), 0);
  const totalSleep = logs.filter((l) => l.sleepHours != null).reduce((sum, l) => sum + l.sleepHours, 0);
  const sleepCount = logs.filter((l) => l.sleepHours != null).length;

  const avgCalories = Math.round(totalCalories / logs.length);
  const avgProtein = parseFloat((totalProtein / logs.length).toFixed(1));
  const avgSleep = sleepCount > 0 ? parseFloat((totalSleep / sleepCount).toFixed(1)) : null;

  const calorieDiff = avgCalories - requiredCalories;
  const proteinDiff = avgProtein - requiredProtein;

  const summary = {
    period: `Last ${days} days`,
    daysLogged: logs.length,
    averages: {
      calories: avgCalories,
      protein: avgProtein,
      sleep: avgSleep,
    },
    requirements: {
      calories: requiredCalories,
      protein: requiredProtein,
    },
    gaps: {
      calories: calorieDiff,
      protein: proteinDiff,
    },
    overallScore: computeHealthScore({ avgCalories, requiredCalories, avgProtein, requiredProtein, avgSleep }),
  };

  return res
    .status(200)
    .json(new ApiResponse(200, summary, "Weekly summary generated."));
});


const computeHealthScore = ({ avgCalories, requiredCalories, avgProtein, requiredProtein, avgSleep }) => {
  let score = 100;

  const caloriePct = (avgCalories / requiredCalories) * 100;
  if (caloriePct < 70 || caloriePct > 130) score -= 20;
  else if (caloriePct < 80 || caloriePct > 120) score -= 10;

  const proteinPct = (avgProtein / requiredProtein) * 100;
  if (proteinPct < 70) score -= 20;
  else if (proteinPct < 85) score -= 10;

  if (avgSleep !== null) {
    if (avgSleep < 6) score -= 15;
    else if (avgSleep < 7) score -= 5;
  }

  return Math.max(score, 0);
};

export default { getTodayInsight, getWeeklySummary };