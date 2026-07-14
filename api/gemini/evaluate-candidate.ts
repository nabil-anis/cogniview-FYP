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

  const { jobTitle, parameters, responses } = req.body;
  if (!jobTitle || !parameters || !responses) {
    res.status(400).json({ error: "jobTitle, parameters, and responses are required." });
    return;
  }

  try {
    const transcript = responses.map((r: any) => `Q: ${r.q}\nA: ${r.a}`).join('\n\n');
    const paramsList = parameters.map((p: any) => `${p.name} (Weight: ${p.weight}%): ${p.description}`).join('\n');

    const prompt = `
      You are an expert HR analyst. Evaluate this candidate's interview performance for the role of "${jobTitle}".
      
      EVALUATION PARAMETERS:
      ${paramsList}

      INTERVIEW TRANSCRIPT:
      ${transcript}

      INSTRUCTIONS:
      1. Score each parameter (0-100).
      2. Provide a total weighted score (0-100).
      3. Identify 2-3 key strengths with evidence.
      4. Identify 1-2 development areas constructively.
      5. Provide a summary recommendation and confidence level.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            parameterScores: {
              type: Type.OBJECT,
              properties: parameters.reduce((acc: any, p: any) => {
                acc[p.name] = { type: Type.NUMBER };
                return acc;
              }, {})
            },
            analysis: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                strengths: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      evidence: { type: Type.STRING }
                    }
                  }
                },
                weaknesses: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      suggestions: { type: Type.STRING }
                    }
                  }
                },
                recommendation: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    });
    res.status(200).json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error("Error in evaluate-candidate:", error);
    res.status(500).json({ error: error?.message || String(error) });
  }
}
