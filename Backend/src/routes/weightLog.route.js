const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const {logWeight, getWeightHistory, getWeeklySummary, deleteWeightLog} = require("../controllers/weightLog.controller");
const { protect, requireEmailVerified, requireProfileComplete } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");

router.use(protect, requireEmailVerified, requireProfileComplete);

const weightValidation = [
  body("weightKg")
    .notEmpty().withMessage("Weight is required")
    .isFloat({ min: 10, max: 500 }).withMessage("Weight must be between 10 and 500 kg"),
  body("note")
    .optional()
    .isLength({ max: 200 }).withMessage("Note cannot exceed 200 characters"),
];


router.post("/", weightValidation, validate, logWeight);
router.get("/history", getWeightHistory);
router.get("/weekly-summary", getWeeklySummary);
router.delete("/:date", deleteWeightLog);

export default router;