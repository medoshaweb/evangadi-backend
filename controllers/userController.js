import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

// ---------------- SIGNUP ----------------
export const signup = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    if (!firstName || !lastName || !username || !email || !password)
      return res.status(400).json({ message: "All fields are required." });

    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });

    // Check for existing user
    const [existing] = await db.execute(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username]
    );
    if (existing.length > 0)
      return res
        .status(400)
        .json({ message: "Email or username already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      "INSERT INTO users (firstName, lastName, username, email, password) VALUES (?, ?, ?, ?, ?)",
      [firstName, lastName, username, email, hashedPassword]
    );

    const user = { id: result.insertId, username, firstName };

    if (!process.env.JWT_SECRET) {
      console.error("❌ Missing JWT_SECRET in .env file");
      return res.status(500).json({ message: "Server misconfiguration." });
    }

    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required." });

    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res.status(400).json({ message: "Invalid email or password." });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password." });

    const payload = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
    };

    if (!process.env.JWT_SECRET)
      return res.status(500).json({ message: "Server misconfiguration." });

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    console.log("Login response:", { token, refreshToken, user: payload });
    res.status(200).json({ token, refreshToken, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// ---------------- REFRESH TOKEN ----------------
export const refreshToken = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token" });

  try {
    const user = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newToken = jwt.sign(
      { id: user.id, username: user.username, firstName: user.firstName },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token: newToken });
  } catch (err) {
    console.error(err);
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};
