
import { EvaluationParameter } from '../types';

export const aiService = {
  async generateParameters(jobTitle: string): Promise<EvaluationParameter[]> {
    try {
      const response = await fetch("/api/gemini/generate-parameters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.map((p: any) => ({ ...p, id: Math.random().toString(36).substr(2, 9) }));
    } catch (e) {
      console.error("Failed to generate parameters via backend:", e);
      return [];
    }
  },

  async rephraseQuestion(original: string): Promise<string[]> {
    try {
      const response = await fetch("/api/gemini/rephrase-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (e) {
      console.error("Failed to rephrase question via backend:", e);
      return [original];
    }
  },

  async evaluateCandidate(
    jobTitle: string,
    parameters: EvaluationParameter[],
    responses: { q: string, a: string }[]
  ) {
    try {
      const response = await fetch("/api/gemini/evaluate-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, parameters, responses })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (e) {
      console.error("Failed to evaluate candidate via backend:", e);
      throw e;
    }
  }
};

