import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
//import cors from "cors";
//import userRoutes from "./routes/user.route.js";
import authRoutes from "./routes/auth.route.js";
import checkRoutes from "./routes/check.route.js"

const app = express();
//app.use(cors({ origin: 'http://localhost:5173', credentials: true}));
dotenv.config();

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB);
    console.log("DATABASE IS RUNNING");
  } catch (error) {
    console.log(error);
  }
};

app.use(express.json());
app.use(cookieParser());

app.use("/api/auths", authRoutes);
app.use("/api/checks", checkRoutes);

app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "SOMETHING WENT WRONG";
  return res.status(errorStatus).send(errorMessage); 
}) 

app.listen(3000, () => {
    connect();
  console.log("SERVER IS RUNNING");
});
