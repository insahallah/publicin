import { GoogleGenAI } from "@google/genai";

// Initialize the client with your API key
const ai = new GoogleGenAI({
  apiKey: 'AIzaSyDrod28WgdLrppqtNUFDQlQAXRTHYnSfIg', // You can also use Config.GEMINI_API_KEY if using react-native-config
});

const DEFAULT_MODELS = [
  'gemini-2.5-flash',              // Main recommended model
  'gemini-2.0-flash',              // Fallback
  'gemini-2.5-flash-lite-preview', // Fallback
];

export const generateDescription = async (prompt, useFallback = true) => {
  for (const model of DEFAULT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const text = response?.text?.trim();

      if (text && text.length > 0) {
        return text;
      }
    } catch (error) {
      console.warn(`Model ${model} failed:`, error.message);
      // continue to next model if useFallback is true
      if (!useFallback) throw error;
    }
  }

  throw new Error("All Gemini AI models failed. Please try again later.");
};
