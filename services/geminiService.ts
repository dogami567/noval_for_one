import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

// Initialize generically, but we will create a fresh instance per call if needed to handle key rotation or ensuring env var is picked up.
// For this demo, we assume the environment variable is set.
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateChronicleResponse = async (userMessage: string, context?: string): Promise<string> => {
  if (!API_KEY) {
    return "I seem to have lost my connection to the Archives (API Key missing).";
  }

  try {
    const model = 'gemini-2.5-flash';
    const systemInstruction = `
      You are the "Keeper of Chronicles", an ancient AI consciousness within a fantasy world map interface.
      Your tone is wise, slightly archaic, but helpful. You know the history of "Aetheria".
      
      Context provided about the currently selected location (if any): ${context || 'None selected'}.
      
      Keep your answers relatively brief (under 80 words) and immersive.
      If asked about a location, embellish the lore based on the name.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "The scrolls are faded... I cannot read the answer.";
  } catch (error) {
    console.error("Error consulting the archives:", error);
    return "Something disrupts my connection to the Aether. Please try again.";
  }
};
