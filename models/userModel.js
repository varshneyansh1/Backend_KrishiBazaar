import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: [true, "email already taken"],
    },
    password: {
      type: String,
      required: [true, "password is required"],
      minLength: [6, "password length should be greater than 6 characters"],
    },
    address: {
      type: String,
    },
    phone: {
      type: String,
      required: [true, "phone no is required"],
      unique: [true, "mobile no already used"],
    },
    docProof: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    role: {
      type: String,
      enum: ["admin", "user" ,],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false, // OTP verification status
    },
    verificationToken: { type: String }, // Store the verification token
    tokenExpiry: { type: Date },
  },
  { timestamps: true }
);
//hash functions
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});
// compare function
userSchema.methods.comparePassword = async function (plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};
//JWT TOkEN
userSchema.methods.generateToken = function () {
  return JWT.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};
export const userModel = mongoose.model("Users", userSchema);
export default userModel;
