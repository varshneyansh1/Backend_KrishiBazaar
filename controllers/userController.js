import {userModel} from "../models/userModel.js";
import crypto from "crypto"
import { sendEmail } from "../services/emailer.service.js";
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const otpSignup = async (req, res) => {
  const { name, email, password, phone, address,role} = req.body;

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }
    // Generate verification token and expiry
    const verificationToken = generateVerificationToken();
    const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // Token expires in 24 hours

    // Create a new user with `isVerified` set to false initially
    const newUser = new userModel({
      name,
      email,
      password,
      phone,
      address,
      role,
      verificationToken,
      tokenExpiry,
      isVerified: false,  // User is not verified initially
    });

    // Save the user to the database
    await newUser.save();

    // Send verification email
    const verificationLink = `https://backend-krishibazaar.onrender.com/api/v1/user/verify-email?token=${verificationToken}&email=${email}`;
    const emailMessage = `
      <h1>Email Verification</h1>
      <p> Hi ${name} Please click the link below to verify your email:</p>
      <a href="${verificationLink}">Verify Email</a>
    `;

    await sendEmail({
      email,
      subject: "Email Verification",
      body: emailMessage,
    });

    return res.status(200).json({ success: true, message: "Verification email sent." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { token, email } = req.query;

  try {
    // Find the user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or token" });
    }

    // Check if the token is valid and not expired
    if (user.verificationToken !== token || user.tokenExpiry < Date.now()) {
      return res.status(400).json({ error: "Token is invalid or has expired" });
    }

    // Mark the user as verified
    user.isVerified = true;
    user.verificationToken = undefined;  // Clear the token after successful verification
    user.tokenExpiry = undefined;  // Clear the token expiry date
    await user.save();

    return res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


export const registerController = async (req, res) => {
    try {
      const { name, email, password, address, phone} =
        req.body;
      // validation
      if (
        !name ||
        !email ||
        !password ||
        !phone
      ) {
        return res.status(500).send({
          success: false,
          message: "Please Provide all fields",
        });
      }
      // check existing user
      const existingUser = await userModel.findOne({ email });
      // validation
      if (existingUser) {
        return res.status(500).send({
          success: false,
          message: "email already taken",
        });
      }
      const user = await userModel.create({
        name,
        email,
        password,
        address,
        phone,
      
      });
      res.status(201).send({
        success: true,
        message: "Registration Success, please login",
        user,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error in Register API",
        error,
      });
    }
  };

  export const loginController = async (req, res) => {
    try {
      const { email, password } = req.body;
      //validation
      if (!email || !password) {
        return registerController.status(500).send({
          success: false,
          message: "please add required credentials",
        });
      }
      //check user
      const user = await userModel.findOne({ email });
      //user validation
      if (!user) {
        return res.status(404).send({
          success: false,
          message: "user not found",
        });
      }
      //check password
      const isMatch = await user.comparePassword(password);
      console.log(isMatch);
      if (!isMatch) {
        return res.status(500).send({
          success: false,
          message: "invalid credential",
        });
      }
      const token = user.generateToken();
  
      res
        .status(200)
        .cookie("token", token, {
          expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          secure: process.env.NODE_ENV === "production" ? true : false,
          httpOnly: process.env.NODE_ENV === "production" ? true : false,
          sameSite: process.env.NODE_ENV === "production" ? true : false,
        })
        .send({
          success: true,
          message: "login successfully",
          token,
          user,
        });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "error in login api",
        error,
      });
    }
  };  
  export const checkIsVerified = async (req, res, next) => {
    const { email } = req.body;
  
    try {
      const user = await userModel.findOne({ email });
      if (!user || !user.isVerified) {
        return res.status(400).json({ error: "User is not verified. Please verify your email id " });
      }
      next();  // If verified, proceed to the next middleware/route handler
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };  
  // get user profile

export const getUserProfileController = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    user.password = undefined;
    res.status(200).send({
      success: true,
      message: "USer Profile Fetched Successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In Profile API",
      error,
    });
  }
};

// LOGOUT
export const logoutController = async (req, res) => {
  try {
    res
      .status(200)
      .cookie("token", "", {
        expires: new Date(Date.now()), // Immediately expire the cookie
        secure: process.env.NODE_ENV === "production", // Secure in production
        httpOnly: process.env.NODE_ENV === "production", // HttpOnly in production
        sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax", // Lax in development
      })
      .send({
        success: true,
        message: "Logout Successfully",
      });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Logout API",
      error,
    });
  }
};
// UPDATE USER PROFILE
export const updateProfileController = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    const { name, email, address, phone } = req.body;
    // validation + Update
    if (name) user.name = name;
    if (email) user.email = email;
    if (address) user.address = address;
    if (phone) user.phone = phone;
    //save user
    await user.save();
    res.status(200).send({
      success: true,
      message: "User Profile Updated",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In update profile API",
      error,
    });
  }
};
// update user passsword
export const udpatePasswordController = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    const { oldPassword, newPassword } = req.body;
    //valdiation
    if (!oldPassword || !newPassword) {
      return res.status(500).send({
        success: false,
        message: "Please provide old or new password",
      });
    }
    // old pass check
    const isMatch = await user.comparePassword(oldPassword);
    //validaytion
    if (!isMatch) {
      return res.status(500).send({
        success: false,
        message: "Invalid Old Password",
      });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).send({
      success: true,
      message: "Password Updated Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In update password API",
      error,
    });
  }
};