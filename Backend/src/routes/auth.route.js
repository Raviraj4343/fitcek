import express from "express";
import { body } from "express-validator";
import rateLimit from "express-rate-limit";
import { signup, verifyEmail, resendVerification, forgotPassword, resetPassword, login, logout, refreshAccessToken, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";


const signupValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email"),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),
];

const loginValidation = [
  body("email").trim().isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const router=express.Router();

// Focused limiter for sensitive auth endpoints (login / forgot-password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many auth attempts. Please wait 15 minutes." },
});

router.post("/signup", signupValidation, validate, signup);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification",
  body("email").isEmail().withMessage("Valid email required"),
  validate,
  resendVerification
);
router.post(
  "/forgot-password",
  authLimiter,
  body("email").isEmail().withMessage("Valid email required"),
  validate,
  forgotPassword
);

router.post(
  "/reset-password",
  body("token").notEmpty().withMessage("Token is required"),
  body("newPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  validate,
  resetPassword
);
router.post("/login", authLimiter, loginValidation, validate, login);
router.post("/logout", protect, logout);
router.post("/refresh-token", refreshAccessToken);
router.get("/me", protect, getMe);

export default router;