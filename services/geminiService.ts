import { GoogleGenAI } from "@google/genai";
import { DOMAIN_INSTRUCTIONS } from "../constants.ts";
import { CopilotDomain } from "../types.ts";

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

export const generateDiagramCode = async (prompt: string, currentCode?: string, domain: CopilotDomain = 'General'): Promise<string> => {
  const ai = getAI();
  const instruction = DOMAIN_INSTRUCTIONS[domain] || DOMAIN_INSTRUCTIONS["General"];
  
  const fullPrompt = currentCode 
    ? `Current Diagram Code:\n\`\`\`mermaid\n${currentCode}\n\`\`\`\n\nUser Request: ${prompt}\n\nUpdate the diagram based on the request. Return the FULL updated mermaid code.`
    : `User Request: ${prompt}\n\nGenerate a mermaid diagram for this request.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
      config: {
        systemInstruction: instruction,
        temperature: 0.2, // Low temperature for deterministic code generation
      },
    });

    return extractMermaidCode(response.text || '');

  } catch (error) {
    console.error("Gemini 3 Flash Generation Error:", error);
    throw error;
  }
};

export const fixDiagramSyntax = async (code: string, errorMessage: string): Promise<string> => {
  const ai = getAI();
  const prompt = `You are an expert Mermaid.js debugger.
The user's diagram code has a syntax error.

Error Message: "${errorMessage}"

Current Code:
\`\`\`mermaid
${code}
\`\`\`

Task: Fix the syntax error in the code. 
Rules:
1. Return ONLY the corrected Mermaid.js code. 
2. Do not add markdown backticks if possible, or ensure they are standard.
3. Maintain the original logic/structure, only fix the syntax.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.1, // Very low temperature for precise fixes
      },
    });

    return extractMermaidCode(response.text || '');
  } catch (error) {
    console.error("Gemini Syntax Fix Error:", error);
    throw error;
  }
};

// Helper to extract code from response
const extractMermaidCode = (text: string): string => {
    // Extract code from markdown blocks
    const match = text.match(/```(?:mermaid)?\n([\s\S]*?)\n```/);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // Fallback if no code block found but text resembles mermaid
    if (text.includes('sequenceDiagram') || text.includes('graph ') || text.includes('classDiagram') || text.includes('flowchart')) {
        return text.trim();
    }
    
    // If it looks like raw code (starts with a keyword)
    const lines = text.split('\n');
    if (lines.length > 0 && /^[a-z]+/.test(lines[0])) {
        return text.trim();
    }

    throw new Error("No valid Mermaid code generated.");
}
