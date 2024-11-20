import mongoose from "mongoose";

const connectDb = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    if (connection.STATES.connected) {
      console.log("connected to MongoDB");
    }
  } catch (error) {
    return error.message;
  }
};

export default connectDb;
