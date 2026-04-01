import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-1.5-flash";

const MAX_WORDS = 15;

const trimWords = (text = "", maxWords = MAX_WORDS) =>
  String(text)
    .trim()
    .split(/\s+/)
    .slice(0, maxWords)
    .join(" ");

const buildPrompt = (payload) => {
  const {
    goal,
    dietPreference,
    bmi,
    bmiCategory,
    requiredCalories,
    requiredProtein,
    actualCalories,
    actualProtein,
    sleepHours,
    steps,
    waterIntake,
    calorieGap,
    proteinGap,
    dailyDiet,
    medicalConditions,
  } = payload;

  return `You are an AI health and fitness assistant for a smart health app.

Analyze the user's data and generate a personalized, practical, and safe recommendation plan.

User Data:
- Goal: ${goal || "maintain"} (fat loss / muscle gain / maintenance)
- BMI Category: ${bmiCategory || "unknown"}
- Daily Calorie Gap: ${calorieGap ?? 0}
- Protein Gap: ${proteinGap ?? 0}
- Steps per day: ${steps ?? "not logged"}
- Sleep (hours): ${sleepHours ?? "not logged"}
- Diet Preference: ${dietPreference || "unknown"} (veg / non-veg / vegan)
- Conditions Summary: ${medicalConditions || "none"}
- Daily diet notes: ${dailyDiet || "none"}
- Required calories: ${requiredCalories ?? "unknown"}
- Required protein (g): ${requiredProtein ?? "unknown"}
- Today's calories: ${actualCalories ?? 0}
- Today's protein (g): ${actualProtein ?? 0}
- BMI value: ${bmi ?? "unknown"}
- Water intake: ${waterIntake ?? "not logged"}

Instructions:
- Be realistic and actionable (no generic advice)
- Avoid medical diagnosis
- Focus on small daily improvements
- Keep recommendations beginner-friendly
- If risk exists, clearly mention it

Return ONLY valid JSON (no text outside JSON):

{
  "actionPlan": [
    "3 clear daily actions"
  ],
  "riskFlags": [
    "any health or lifestyle risks"
  ],
  "nutritionFocus": [
    "specific food or nutrient advice"
  ],
  "trainingFocus": [
    "exercise recommendations"
  ],
  "recoveryFocus": [
    "sleep, hydration, recovery tips"
  ]
}

Ensure each array has at least 2-4 concise items. Keep each item under 15 words.
`;
};

const safeJsonParse = (rawText) => {
  const text = String(rawText || "").trim();

  try {
    return JSON.parse(text);
  } catch {
    // handle fenced or extra text responses
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("Invalid JSON from model");
  }
};

const normalizePlan = (parsed) => {
  const normalizeList = (value, min = 2, max = 4) => {
    const list = Array.isArray(value)
      ? value
          .map((item) => trimWords(item, MAX_WORDS))
          .filter(Boolean)
      : [];

    if (list.length < min) {
      throw new Error("Model returned insufficient items in one or more sections");
    }

    return list.slice(0, max);
  };

  return {
    actionPlan: normalizeList(parsed?.actionPlan, 2, 4),
    riskFlags: normalizeList(parsed?.riskFlags, 2, 4),
    nutritionFocus: normalizeList(parsed?.nutritionFocus, 2, 4),
    trainingFocus: normalizeList(parsed?.trainingFocus, 2, 4),
    recoveryFocus: normalizeList(parsed?.recoveryFocus, 2, 4),
  };
};

const generateRealtimeActionPlan = async (payload) => {
  const apiKey = process.env.HEALTH_API;
  if (!apiKey) {
    throw new Error("HEALTH_API is missing in environment variables.");
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: MODEL_NAME });
  const prompt = buildPrompt(payload);

  const result = await model.generateContent(prompt);
  const text = result?.response?.text?.() || "";
  const parsed = safeJsonParse(text);
  return normalizePlan(parsed);
};

export { generateRealtimeActionPlan };
