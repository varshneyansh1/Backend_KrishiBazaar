import express from "express";
import {
  checkIsVerified,
  getUserProfileController,
  loginController,
  logoutController,
  otpSignup,
  verifyEmail,
} from "../controllers/userController.js";
import { isAuth } from "../middlewares/authMiddleware.js";

// router object
const router = express.Router();
// register
router.post("/register", otpSignup);
router.get("/verify-email", verifyEmail); // Verify OTP and create user
//login
router.post("/login", checkIsVerified, loginController);
//profile
router.get("/profile", isAuth, getUserProfileController);
//logout
router.get("/logout", isAuth, logoutController);

export default router;
