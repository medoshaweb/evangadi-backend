import "dotenv/config"; // automatically loads .env
import db from "./config/db.js";
import express from "express";
import cors from "cors";
const router = express.Router();
import authRoutes from "./routes/auth.js";
import answersRoutes from "./routes/answerRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import installRoutes from "./routes/installRoutes.js";

// Install route


const app = express();
const PORT = process.env.PORT || 5000;

app.use("/", installRoutes);
app.use(cors());
   
app.use(express.json());
app.use("/api/auth", authRoutes);

// Routes
app.use("/api/questions", questionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/answers", answersRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
async function startServer() {
  try {
    await db.query("SELECT 1"); // Test DB connection
    console.log("✅ MySQL promise-based pool created");
  } catch (err) {
    console.error("⚠️  Database connection failed:", err.message);
    console.log("⚠️  Server will start without database. Some features may not work.");
    // Don't exit - allow server to start for testing (e.g., AI endpoints that don't need DB)
  }
  
  // Start server regardless of DB connection status
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();