import express from "express";
import {
  getQuestions,
  getQuestionWithAnswers,
  createQuestion,
  searchQuestions,
  voteQuestion,
} from "../controllers/questionController.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();



// 📍 POST /api/questions/search
router.post("/search", async (req, res) => {
  const { query } = req.body;

  if (!query || query.trim() === "") {
    return res.status(400).json({ message: "Query is required" });
  }

  try {
    // 🧠 Search title and description for similar matches
    const [questions] = await db.query(
      "SELECT id, title, description FROM questions WHERE title LIKE ? OR description LIKE ? LIMIT 5",
      [`%${query}%`, `%${query}%`]
    );

    res.status(200).json({ questions });
  } catch (err) {
    console.error("Database search error:", err);
    res.status(500).json({ message: "Error searching questions" });
  }
});

router.get("/", getQuestions); // Supports ?page=&limit=&search=
// router.get("/", verifyToken, getQuestions);
router.get("/search", verifyToken, searchQuestions);
router.get("/:id", verifyToken, getQuestionWithAnswers);
router.post("/", verifyToken, createQuestion);
router.post("/vote", verifyToken, voteQuestion);

export default router; // ✅ this makes the import work
