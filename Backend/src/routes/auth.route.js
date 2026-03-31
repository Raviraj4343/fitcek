import express from "express";
import { body } from "express-validator";
import { signup, verifyEmail, resendVerification, login, logout, refreshAccessToken, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";


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

router.post("/signup", signupValidation, validate, signup);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification",
  body("email").isEmail().withMessage("Valid email required"),
  validate,
  resendVerification
);
router.post("/login", loginValidation, validate, login);
router.post("/logout", protect, logout);
router.post("/refresh-token", refreshAccessToken);
router.get("/me", protect, getMe);

export default router;