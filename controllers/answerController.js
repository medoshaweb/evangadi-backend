import db from "../config/db.js";

// Create a new answer
export const createAnswer = async (req, res) => {
  const { questionId } = req.params;
  const { answerText } = req.body; // include userId if needed
  const userId = req.user?.id; // get from verifyToken middleware

  console.log("Received body:", req.body);

  console.log(
    "questionId:",
    questionId,
    "answerText:",
    answerText,
    "userId:",
    userId
  );
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: no user info" });
  }

  if (!answerText) {
    return res.status(400).json({ message: "Answer text is required" });
  }

  try {
    const [result] = await db.execute(
      "INSERT INTO answers (question_id, user_id, answer) VALUES (?, ?, ?)",
      [questionId, userId, answerText]
    );

    res.status(201).json({
      message: "Answer created successfully",
      answerId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating answer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};




// 🆕 Get answers by questionId
export const getAnswersByQuestionId = async (req, res) => {
  try {
    const { questionId } = req.params;
    console.log("Fetching answers for question:", questionId);

    const [rows] = await db.execute(
      "SELECT * FROM answers WHERE question_id = ?",
      [questionId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error fetching answers:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Vote on an answer
export const voteAnswer = async (req, res) => {
  try {
    // ✅ Get user from token
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // ✅ Get answerId and vote from request
    const { answerId, vote } = req.body;

    console.log("voteAnswer body:", req.body);
    console.log("User from token:", req.user);

    // Convert to numbers to handle string inputs
    const voteNum = Number(vote);
    const answerIdNum = Number(answerId);

    if (!answerIdNum || ![-1, 1].includes(voteNum)) {
      return res.status(400).json({ 
        message: "Invalid vote data. Vote must be 1 or -1, answerId is required." 
      });
    }

    // ✅ Insert or update vote
    await db.query(
      `INSERT INTO answer_votes (user_id, answer_id, vote)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE vote = ?`,
      [userId, answerIdNum, voteNum, voteNum]
    );

    // ✅ Calculate total votes
    const [result] = await db.query(
      `SELECT COALESCE(SUM(vote), 0) AS totalVotes
       FROM answer_votes
       WHERE answer_id = ?`,
      [answerIdNum]
    );

    console.log("Updated totalVotes:", result[0].totalVotes);

    res.json({ totalVotes: result[0].totalVotes });
  } catch (err) {
    console.error("voteAnswer error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
