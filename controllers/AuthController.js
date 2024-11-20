import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// SIGNUP ROUTE
const signup = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ success: false, message: "Please Login" });
    }

    const securePassword = await bcrypt.hash(password, 10);

    user = await User.create({
      name,
      email,
      password: securePassword,
    });

    await user.save();
    return res
      .status(201)
      .json({ success: true, message: "Signup Successful" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// LOGIN ROUTE
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: "Please Signup" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
      .status(200)
      .json({ success: true, message: "Login Successful" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// LOGOUT ROUTE
const logout = async (req, res) => {
  try {
    res.clearCookie("token").json({ success: true, message: "Logged Out" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET USER ROUTE
const getUser = async (req, res) => {
  // req.id is typically set using JWT through middleware.(verifyToken.js)
  const reqId = req.id;

  try {
    let user = await User.findById(reqId).select("-password");

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user, message: "User found" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// RESET PASSWORD ROUTE
const resetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const generateOtp = Math.floor(Math.random() * 10000); // Generate 4 digit OTP
    let user = User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Please Signup" });
    }

    var transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "f5c85f2f73dde9",
        pass: "9bfcdf380c0714",
      },
    });

    const info = await transporter.sendMail({
      from: "sudhanshu734999@gmail.com",
      to: email,
      subject: "New Otp has been generated",
      html: `<h3>Your generated Otp is : <i>${generateOtp}</i></h3>`,
    });

    // nodemailer generates a message id after message has been sent
    if (info.messageId) {
      await user.findOneAndUpdate(
        { email },
        {
          $set: {
            otp: generateOtp,
          },
        }
      );
      return res
        .status(200)
        .json({ success: true, message: "otp has been sent to your email" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// VERIFY OTP ROUTE
const verifyOtp = async (req, res) => {
  const { otp, newPassword } = req.body;

  try {
    const securePassword = await bcrypt.hash(newPassword, 10);

    let user = await User.findOneAndUpdate(
      { otp },
      {
        $set: {
          password: newPassword,
          otp: 0,
        },
      }
    );

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid Otp" });
    }

    return res.status(200).json({ success: true, message: "Password Updated" });
  } catch (error) {
    return res.status(500).json({ success: true, message: error.message });
  }
};

export { signup, login, logout, getUser, resetPassword, verifyOtp };
