
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateAnswer(prompt) {
  const response = await genAI.models.generateContent({
    model: "gemini-1.5-pro-002",
    contents: prompt,
  });
  return response.text;
}













