import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export async function generateAnswer(prompt) {
  if (!apiKey) {
    // Local fallback so frontend flow can be verified without deploying
    return `Demo AI response: ${prompt}`;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use fastest models first (flash models are much faster than pro)
    // Try fastest first: gemini-1.5-flash-latest is the fastest
    const modelsToTry = [
      "gemini-1.5-flash-latest", // Fastest - try first
      "gemini-2.0-flash-001", // Fast alternative
      "gemini-2.5-pro", // Fallback if flash unavailable
    ];

    // Create a prompt that requests concise, readable responses
    const enhancedPrompt = `Provide a brief, clear explanation for: "${prompt}". 

Requirements:
- Keep it concise (2-3 short paragraphs maximum)
- Use simple, clear language
- Format with proper line breaks for readability
- Focus on the most important points
- Avoid long examples or extensive details`;

    let lastError = null;
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            maxOutputTokens: 300, // Limit response length for speed
            temperature: 0.7,
          },
        });

        // Add timeout - cancel request after 15 seconds
        const apiCall = model.generateContent(enhancedPrompt);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("AI request timeout after 15 seconds")),
            15000
          );
        });

        // Race between API call and timeout
        const result = await Promise.race([apiCall, timeoutPromise]);
        const response = result.response;
        return response.text();
      } catch (modelError) {
        lastError = modelError;
        // If timeout, don't try other models
        if (modelError.message.includes("timeout")) {
          throw new Error("AI response took too long. Please try again.");
        }
        console.log(`Model ${modelName} failed: ${modelError.message}`);
        continue;
      }
    }

    // If all models failed
    throw new Error(
      `All AI models unavailable. Please verify your GEMINI_API_KEY is valid and has access to generative models. Last error: ${
        lastError?.message || "Unknown error"
      }`
    );
  } catch (err) {
    // Provide a readable error to the route for logging and client display
    throw new Error(err?.message || "Failed to generate AI content");
  }
}
