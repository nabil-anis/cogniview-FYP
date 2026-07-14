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

  const { jobTitle } = req.body;
  if (!jobTitle) {
    res.status(400).json({ error: "jobTitle is required." });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 4 professional evaluation parameters for the job role: "${jobTitle}". 
      Include a name, a short description, and suggested weights (total must sum to 100).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              weight: { type: Type.NUMBER }
            },
            required: ["name", "description", "weight"]
          }
        }
      }
    });
    
    // Vercel/Express res.json() works the same
    const data = JSON.parse(response.text || '[]');
    res.status(200).json(data);
  } catch (error: any) {
    console.error("Error in generate-parameters:", error);
    res.status(500).json({ error: error?.message || String(error) });
  }
}
