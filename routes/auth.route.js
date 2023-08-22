import express from "express";
import { login, register, logout, reg, log, verify, verified } from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/jwt.js";

const router = express.Router();

router.post('/register', register)
router.post('/reg', reg)
router.post('/log', log)
router.post('/login', login)
router.post('/logout', logout)
router.get('/verified', verified)
router.get('/verify/:userId/:uniqueString', verify)

export default router;