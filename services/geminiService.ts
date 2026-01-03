
import { GoogleGenAI } from "@google/genai";

export const getAiResponse = async (prompt: string): Promise<string> => {
  // Use process.env.API_KEY directly for initialization as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are 'Aura', a romantic and helpful relationship assistant for a couple's private app. Be supportive, empathetic, and occasionally use romantic metaphors. Keep responses concise.",
        temperature: 0.8,
      },
    });
    // Use .text property directly
    return response.text || "I'm sorry, I couldn't think of anything to say right now.";
  } catch (error) {
    console.error("AI Error:", error);
    return "The stars are a bit cloudy tonight. I can't connect right now.";
  }
};
