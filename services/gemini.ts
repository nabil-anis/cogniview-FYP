
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationParameter } from '../types';

// Initialize lazily to prevent crash on module load if env is missing
// The user has requested to use GEMINI_API_KEY
const getAi = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const aiService = {
  async generateParameters(jobTitle: string): Promise<EvaluationParameter[]> {
    try {
      const response = await getAi().models.generateContent({
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
      return data.map((p: any) => ({ ...p, id: Math.random().toString(36).substr(2, 9) }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async rephraseQuestion(original: string): Promise<string[]> {
    try {
      const response = await getAi().models.generateContent({
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
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error(e);
      return [original];
    }
  },

  async evaluateCandidate(
    jobTitle: string,
    parameters: EvaluationParameter[],
    responses: { q: string, a: string }[]
  ) {
    const transcript = responses.map(r => `Q: ${r.q}\nA: ${r.a}`).join('\n\n');
    const paramsList = parameters.map(p => `${p.name} (Weight: ${p.weight}%): ${p.description}`).join('\n');

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

    try {
      const response = await getAi().models.generateContent({
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
                properties: parameters.reduce((acc: any, p) => {
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
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
};
