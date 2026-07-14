import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize the Gemini client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API endpoint for generating parameters
  app.post("/api/gemini/generate-parameters", async (req, res) => {
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
      const data = JSON.parse(response.text || '[]');
      res.json(data);
    } catch (error: any) {
      console.error("Error in generate-parameters:", error);
      res.status(500).json({ error: error?.message || String(error) });
    }
  });

  // API endpoint for rephrasing questions
  app.post("/api/gemini/rephrase-question", async (req, res) => {
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
      res.json(JSON.parse(response.text || '[]'));
    } catch (error: any) {
      console.error("Error in rephrase-question:", error);
      res.status(500).json({ error: error?.message || String(error) });
    }
  });

  // API endpoint for evaluating candidate
  app.post("/api/gemini/evaluate-candidate", async (req, res) => {
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
      res.json(JSON.parse(response.text || '{}'));
    } catch (error: any) {
      console.error("Error in evaluate-candidate:", error);
      res.status(500).json({ error: error?.message || String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
