import express from "express";
import { signup, login, refreshToken } from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh-token", refreshToken); // ✅ new route

export default router;
