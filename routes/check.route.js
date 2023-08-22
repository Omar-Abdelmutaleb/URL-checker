import express from "express";
import {
  createCheck,
  deleteCheckById,
  getCheckByName,
  updateCheckById,
} from "../controllers/check.controller.js";
import { verifyToken } from "../middlewares/jwt.js";

const router = express.Router();

router.post("/create", verifyToken, createCheck);
router.get("/", verifyToken, getCheckByName);
router.delete("/:id", verifyToken, deleteCheckById);
router.put("/:id", verifyToken, updateCheckById);

export default router;
