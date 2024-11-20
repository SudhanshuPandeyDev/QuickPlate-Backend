import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDb from "./connection.js";
import dotenv from "dotenv";
import router from "./routes.js";

const app = express();
const port = 5000;
dotenv.config();

connectDb();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://quick-plate.vercel.app/"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Use the imported routes
app.use("/api", router);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
