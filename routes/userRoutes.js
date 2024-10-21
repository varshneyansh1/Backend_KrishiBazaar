import express from "express";
import {
  checkIsVerified,
  getUserProfileController,
  loginController,
  logoutController,
  otpSignup,
  udpatePasswordController,
  updateProfileController,
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
//update profile
router.put("/profile-update", isAuth, updateProfileController);
// updte password
router.put("/update-password", isAuth, udpatePasswordController);
export default router;
