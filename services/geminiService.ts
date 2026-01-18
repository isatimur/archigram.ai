import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let aiInstance: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!aiInstance) {
    if (!process.env.API_KEY) {
      throw new Error("API Key is missing. Please ensure process.env.API_KEY is available.");
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
};

export const generateDiagramCode = async (prompt: string, currentCode?: string): Promise<string> => {
  const ai = getAI();
  const fullPrompt = currentCode 
    ? `Current Diagram Code:\n\`\`\`mermaid\n${currentCode}\n\`\`\`\n\nUser Request: ${prompt}\n\nUpdate the diagram based on the request. Return the FULL updated mermaid code.`
    : `User Request: ${prompt}\n\nGenerate a mermaid diagram for this request.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Low temperature for deterministic code generation
      },
    });

    const text = response.text || '';
    
    // Extract code from markdown blocks
    const match = text.match(/```(?:mermaid)?\n([\s\S]*?)\n```/);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // Fallback if no code block found but text resembles mermaid
    if (text.includes('sequenceDiagram') || text.includes('graph ') || text.includes('classDiagram')) {
        return text.trim();
    }

    throw new Error("No valid Mermaid code generated.");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
