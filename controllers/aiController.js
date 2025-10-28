// controllers/aiController.js
import "dotenv/config";
import { createEmbedding } from "../ai/ai.js"; // Hugging Face helper
import db from "../config/db.js"; // your MySQL connection

// 1) Suggest improved question title/body
export async function suggestQuestion(req, res) {
  try {
    const { title, body } = req.body;
    const titleSafe = (title || "").trim();
    const bodySafe = (body || "").trim();

    if (!titleSafe || !bodySafe) {
      return res
        .status(400)
        .json({ ok: false, error: "Title and body cannot be empty" });
    }

    const suggestion = {
      title: title,
      summary: body.slice(0, 100) + (body.length > 100 ? "..." : ""),
      tags: [],
    };

    res.json({ ok: true, suggestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

// 2) Recommend answers
export async function recommendAnswers(req, res) {
  try {
    const { questionTitle, questionBody, existingAnswers = [] } = req.body;

    const recommendations = existingAnswers.length
      ? existingAnswers
      : [
          { title: "Sample answer 1", body: "This is a placeholder answer." },
          { title: "Sample answer 2", body: "Another placeholder answer." },
        ];

    res.json({ ok: true, recommendations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

// 3) Semantic search using Hugging Face embeddings stored in MySQL
export async function semanticSearch(req, res) {
  try {
    const { query, topK = 5 } = req.body;
    if (!query || !query.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: "Query cannot be empty" });
    }

    // 1️⃣ Generate embedding for the query
    const qEmb = await createEmbedding(query);
    if (!qEmb) {
      return res
        .status(500)
        .json({ ok: false, error: "Failed to create embedding" });
    }

    // 2️⃣ Fetch all question embeddings
    db.query(
      "SELECT question_id, embedding FROM question_embeddings",
      (err, results) => {
        if (err) return res.status(500).json({ ok: false, error: "DB error" });

        // 3️⃣ Compute cosine similarity
        const similarities = results.map((r) => {
          const emb = JSON.parse(r.embedding); // stored as JSON in DB
          const score = cosineSimilarity(qEmb, emb);
          return { question_id: r.question_id, score };
        });

        // 4️⃣ Sort by similarity
        similarities.sort((a, b) => b.score - a.score);

        // 5️⃣ Return top K
        const topResults = similarities.slice(0, topK);
        res.json({ ok: true, results: topResults });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

// cosine similarity helper
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}
