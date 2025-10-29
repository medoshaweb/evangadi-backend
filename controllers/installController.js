import db from "../config/db.js";
export const install = async (req, res) => {
  try {
    // 🧱 1. Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
    `);

    
    // 📝 3. Questions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
    `);

    // 💬 4. Answers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  user_id INT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
    `);

   // 👥 5. Groups table
    await db.query(`
     CREATE TABLE IF NOT EXISTS question_embeddings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  embedding JSON NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);
    `);

    // 👥 6. User-Groups table
    await db.query(`
        CREATE TABLE IF NOT EXISTS question_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  user_id INT NOT NULL,
  vote TINYINT NOT NULL, -- 1 for upvote, -1 for downvote
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_vote (question_id, user_id),
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
    `);

    // 🌱 7. Insert sample groups
    await db.query(`
     CREATE TABLE IF NOT EXISTS answer_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  answer_id INT NOT NULL,
  user_id INT NOT NULL,
  vote TINYINT NOT NULL, -- 1 for upvote, -1 for downvote
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_vote (answer_id, user_id),
  FOREIGN KEY (answer_id) REFERENCES answers(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
    `);

    res
      .status(201)
      .json({ msg: "✅ Tables created and upgraded successfully" });
  } catch (error) {
    console.error("❌ Error creating tables:", error.message);
    res.status(500).json({ msg: "Something went wrong, try again later" });
  }
};

export default { install };