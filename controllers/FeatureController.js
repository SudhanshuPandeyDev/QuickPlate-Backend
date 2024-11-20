import User from "../models/User.js";
import Food from "../models/Food.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_KEY, {
  telemetry: false, // Disable telemetry if you don't want Stripe to collect data
});

// ADD TO CART ROUTE
const addToCart = async (req, res) => {
  const userId = req.params.id;
  const { id, name, price, rating, image, quantity } = req.body;

  try {
    // Check if the item already exists in the cart
    let existingItem = await Food.findOne({ id, userId });

    if (existingItem) {
      // If the item exists, update it by increasing the quantity and total price
      const updatedItem = await Food.findOneAndUpdate(
        { id, userId },
        {
          $set: {
            quantity: existingItem.quantity + 1,
            totalPrice: existingItem.price * (existingItem.quantity + 1),
          },
        },
        {
          new: true, // Return the updated document
        }
      );

      // If the item update fails, return an error response
      if (!updatedItem) {
        return res
          .status(400)
          .json({ success: false, message: "Failed to update the cart item" });
      }

      return res
        .status(200)
        .json({ success: true, message: "Cart item updated" });
    }

    // If the item does not exist in the cart, create a new one
    const newFood = new Food({
      id,
      name,
      price,
      rating,
      image,
      quantity,
      userId,
      totalPrice: price * quantity,
    });

    const savedFood = await newFood.save();

    // Add the newly created food item to the user's cart
    const user = await User.findOneAndUpdate(
      { _id: userId },
      {
        $push: { cartItems: savedFood._id }, // Add food item ID to user's cart
      },
      { new: true } // Return the updated user document
    );

    // If the user update fails, return an error response
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Failed to add food item to user cart",
      });
    }

    return res.status(200).json({ success: true, message: "Added to cart" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while adding to the cart",
    });
  }
};

// GET CART ITEMS ROUTE
const getCart = async (req, res) => {
  const userId = req.params.id;
  try {
    const cartItems = await Food.find({ userId });

    if (!cartItems || cartItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items found" });
    }

    return res.status(200).json({ success: true, cartItems });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// REMOVE FROM CART ROUTE
const removeFromCart = async (req, res) => {
  const id = req.params.id;
  try {
    let food = await Food.findOneAndDelete({ _id: id });

    if (!food) {
      return res
        .status(400)
        .json({ success: false, message: "Food not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Removed from cart",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// INCREMENT QUANTITY ROUTE
const incrementQuantity = async (req, res) => {
  const id = req.params.id;

  try {
    // Find the food item by ID
    const food = await Food.findById(id);

    if (!food) {
      return res
        .status(400)
        .json({ success: false, message: "Food not found" });
    }

    // Increment the quantity and recalculate the total price
    const updatedFood = await Food.findByIdAndUpdate(
      id,
      {
        $inc: { quantity: 1 }, // Increment quantity by 1
        $set: { totalPrice: food.price * (food.quantity + 1) }, // Update totalPrice
      },
      { new: true } // Return the updated document
    );

    return res.status(200).json({
      success: true,
      message: "Food quantity incremented",
      food: updatedFood,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DECREMENT QUANTITY ROUTE
const decrementQuantity = async (req, res) => {
  const id = req.params.id;

  try {
    // Find the food item by ID
    const food = await Food.findById(id);

    if (!food || food.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Food item not found or quantity is already at the minimum limit",
      });
    }

    // Decrement the quantity and recalculate the total price
    const updatedFood = await Food.findByIdAndUpdate(
      id,
      {
        $inc: { quantity: -1 }, // Decrement quantity by 1
        $set: { totalPrice: food.totalPrice - food.price }, // Update totalPrice
      },
      { new: true } // Return the updated document
    );

    return res.status(200).json({
      success: true,
      message: "Food quantity decremented",
      food: updatedFood,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// CHECKOUT ROUTE
const checkout = async (req, res) => {
  const userId = req.id;
  try {
    const cartItems = await Food.find({ userId });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: cartItems.map((item) => {
        return {
          price_data: {
            currency: "inr",
            product_data: {
              name: item.name,
              images: [item.image],
            },
            unit_amount: item.price * 100, //Ensure unit_amount is in cents (100 paise = 1 INR)
          },
          quantity: item.quantity,
        };
      }),
      success_url: "https://quick-plate.vercel.app/success",
      cancel_url: "https://quick-plate.vercel.app/",
    });

    res.json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ success: true, message: error.message });
  }
};

// CLEAR CART ROUTE
const clearCart = async (req, res) => {
  const userId = req.id;
  try {
    // Delete all food items from the user's cart
    const deletedItems = await Food.deleteMany({ userId });

    // Optionally, if your User model has a cartItems array, update it to be empty
    const deletedList = await User.findOneAndUpdate(
      { _id: userId },
      { cartItems: [] }
    );

    if (!deletedItems) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to clear cart" });
    }

    return res.status(200).json({ success: true, message: "Order Confirmed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  addToCart,
  getCart,
  removeFromCart,
  incrementQuantity,
  decrementQuantity,
  checkout,
  clearCart,
};
