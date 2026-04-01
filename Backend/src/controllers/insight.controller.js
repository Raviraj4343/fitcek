import asyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  calculateBMI,
  calculateDailyCalories,
  calculateDailyProtein,
  generateInsights,
  computeHealthReport,
} from "../utils/HealthCalculation.js";
import DailyLog from "../models/dailylog.model.js";
import { generateRealtimeActionPlan } from "../utils/healthActionPlanAI.js";

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

  // Use computeHealthReport to generate a consolidated report and recommendations
  const report = computeHealthReport(user, logData);

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
    healthReport: report,
  };

  return res.status(200).json(new ApiResponse(200, response, "Today's insights generated."));
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

const getActionPlan = asyncHandler(async (req, res) => {
  const user = req.user;
  const today = getTodayIST();
  const { dailyDiet = "", medicalConditions = "", goal } = req.body || {};

  const activeGoal = goal || user.goal;

  const log = await DailyLog.findOne({ userId: user._id, date: today });
  const totals = {
    totalCalories: log?.totalCalories || 0,
    totalProtein: log?.totalProtein || 0,
    sleepHours: log?.sleepHours ?? null,
    steps: log?.steps ?? null,
    waterIntake: log?.waterIntake ?? null,
  };

  const { bmi, category: bmiCategory } = calculateBMI(user.weightKg, user.heightCm);
  const requiredCalories = calculateDailyCalories({ ...user.toObject(), goal: activeGoal });
  const requiredProtein = calculateDailyProtein(user.weightKg, activeGoal);
  const calorieGap = Math.max(0, requiredCalories - totals.totalCalories);
  const proteinGap = Math.max(0, requiredProtein - totals.totalProtein);

  let plan;
  let source = "ai";

  try {
    plan = await generateRealtimeActionPlan({
      goal: activeGoal,
      dietPreference: user.dietPreference,
      bmi,
      bmiCategory,
      requiredCalories,
      requiredProtein,
      actualCalories: totals.totalCalories,
      actualProtein: totals.totalProtein,
      sleepHours: totals.sleepHours,
      steps: totals.steps,
      waterIntake: totals.waterIntake,
      calorieGap,
      proteinGap,
      dailyDiet,
      medicalConditions,
    });
  } catch {
    source = "fallback";
    const report = computeHealthReport({ ...user.toObject(), goal: activeGoal }, totals);
    const suggestions = (report.suggestions || []).map((s) => String(s)).filter(Boolean);
    const warnings = (report.warnings || []).map((s) => String(s)).filter(Boolean);
    const insights = (report.insights || []).map((s) => String(s)).filter(Boolean);

    plan = {
      actionPlan: [
        suggestions[0] || "Anchor each meal with protein and vegetables.",
        suggestions[1] || "Take two 10-minute walks after main meals.",
        suggestions[2] || "Log sleep and hydration daily for better guidance.",
      ],
      riskFlags: [
        warnings[0] || "Calorie or protein target may be off-track today.",
        warnings[1] || "Low sleep or low activity can reduce recovery quality.",
      ],
      nutritionFocus: [
        insights[0] || "Close calorie gap with whole-food carbs and lean protein.",
        insights[1] || "Add one high-protein snack to improve daily total.",
      ],
      trainingFocus: [
        "Target 7000+ steps with short post-meal walks.",
        "Do beginner strength training three times weekly.",
      ],
      recoveryFocus: [
        "Aim for seven to nine hours of sleep.",
        "Hydrate steadily across the day, not only at night.",
      ],
    };
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        date: today,
        source,
        plan,
        context: {
          goal: activeGoal,
          bmi,
          bmiCategory,
          requiredCalories,
          requiredProtein,
          actualCalories: totals.totalCalories,
          actualProtein: totals.totalProtein,
          calorieGap,
          proteinGap,
          sleepHours: totals.sleepHours,
          steps: totals.steps,
          waterIntake: totals.waterIntake,
        },
      },
      "Action plan generated."
    )
  );
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

export { getTodayInsight, getWeeklySummary, getActionPlan };
