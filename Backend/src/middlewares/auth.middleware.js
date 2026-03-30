import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/AsyncHandler.js";
import { verifyToken } from "../utils/generateTokens.js";
import User from "../models/user.model.js";

/**
 * Protect routes – verifies the access token
 * Token can be in Authorization header or httpOnly cookie
 */
const protect = asyncHandler(async (req, _res, next) => {
  let token;

  // 1. Try cookie first
  if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }
  // 2. Try Authorization header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Access denied. Please log in.");
  }

  let decoded;
  try {
    decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token. Please log in again.");
  }

  const user = await User.findById(decoded._id);
  if (!user) {
    throw new ApiError(401, "User no longer exists.");
  }

  req.user = user;
  next();
});

/**
 * Ensure email is verified before accessing protected resources
 */
const requireEmailVerified = asyncHandler(async (req, _res, next) => {
  if (!req.user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email address first.");
  }
  next();
});

/**
 * Ensure user profile is complete before accessing daily features
 */
const requireProfileComplete = asyncHandler(async (req, _res, next) => {
  if (!req.user.profileCompleted) {
    throw new ApiError(403, "Please complete your profile setup first.");
  }
  next();
});

export { protect, requireEmailVerified, requireProfileComplete };