import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { original } = req.body;
  if (!original) {
    res.status(400).json({ error: "original is required." });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Rephrase this interview question in 3 different ways while maintaining the same professional intent: "${original}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    res.status(200).json(JSON.parse(response.text || '[]'));
  } catch (error: any) {
    console.error("Error in rephrase-question:", error);
    res.status(500).json({ error: error?.message || String(error) });
  }
}
