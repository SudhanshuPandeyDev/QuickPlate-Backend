import { Router } from "express";
import {
  signup,
  login,
  logout,
  getUser,
  resetPassword,
  verifyOtp,
} from "./controllers/AuthController.js";
import {
  addToCart,
  removeFromCart,
  getCart,
  incrementQuantity,
  decrementQuantity,
  checkout,
  clearCart,
} from "./controllers/FeatureController.js";
import { verifyToken } from "./middlewares/verifyToken.js";

const router = Router();

// AUTH ROUTES
router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);
router.put("/reset-password", resetPassword);
router.put("/verify-otp", verifyOtp);
router.get("/get-user", verifyToken, getUser);

// FEATURE ROUTESS
router.post("/add-to-cart/:id", addToCart);
router.get("/get-cart/:id", getCart);
router.delete("/remove-from-cart/:id", removeFromCart);
router.put("/increment-quantity/:id", incrementQuantity);
router.put("/decrement-quantity/:id", decrementQuantity);
router.get("/checkout", verifyToken, checkout);
router.get("/clear-cart", verifyToken, clearCart);

export default router;
