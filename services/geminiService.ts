import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Analyzes a document image or PDF to extract structure and convert to a template format.
 * Uses Gemini 3 Pro with Thinking Mode for complex layout reasoning.
 */
export const analyzeDocumentImage = async (base64Data: string, mimeType: string = 'image/jpeg'): Promise<AnalysisResponse> => {
  if (!apiKey) throw new Error("API Key missing");

  const prompt = `
    Analyze this document (likely a formal letter). 
    I need you to extract the content and structure to create a Laravel Blade template.
    
    1. Identify the Header/Kop Surat info (Institution name, address).
    2. Extract the main body content as HTML. 
       - CRITICAL: Detect dynamic parts (names, dates, numbers, recipients) and replace them with standard Blade syntax placeholders, e.g., {{ $nama_penerima }}, {{ $tanggal }}.
       - Use inline styles for bolding, alignment, or underlining found in the document.
    3. Identify signature area information.
    4. List all the variables you created in the HTML so the user can control them.

    Return the result strictly as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 16000 }, // Thinking mode for better layout analysis
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            institutionName: { type: Type.STRING },
            institutionAddress: { type: Type.STRING },
            htmlContent: { type: Type.STRING, description: "The body content with {{ $variable }} syntax." },
            detectedVariables: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING, description: "The variable name used in HTML, e.g. nama_penerima" },
                  label: { type: Type.STRING, description: "Human readable label" },
                  defaultValue: { type: Type.STRING, description: "The value found in the image" }
                }
              }
            },
            signatureName: { type: Type.STRING },
            signatureTitle: { type: Type.STRING },
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResponse;
    }
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

/**
 * Generates or modifies a logo based on a prompt and aspect ratio.
 * Uses Gemini 3 Pro Image Preview.
 */
export const generateLogo = async (prompt: string, aspectRatio: string): Promise<string> => {
    if (!apiKey) throw new Error("API Key missing");
    
    // Gemini 3 Pro Image supports specific aspect ratios
    // Supported: "1:1", "3:4", "4:3", "9:16", "16:9"
    // We map 21:9 or others to nearest supported or handle via cropping in CSS, 
    // but the API call must be valid.
    let validRatio = "1:1";
    if (["1:1", "3:4", "4:3", "9:16", "16:9"].includes(aspectRatio)) {
        validRatio = aspectRatio;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [{ text: `Generate a professional, minimalist, vector-style logo for an institution or company. Description: ${prompt}` }]
            },
            config: {
                imageConfig: {
                    aspectRatio: validRatio as any, // Cast because SDK types might trail behind model updates
                    imageSize: "1K"
                }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image data generated");
    } catch (error) {
        console.error("Gemini Image Gen Error:", error);
        throw error;
    }
}

/**
 * Quick text improvement or variable renaming using Flash Lite.
 */
export const suggestImprovements = async (currentText: string, instruction: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-preview-02-05',
        contents: `Context: ${currentText}. Instruction: ${instruction}. Return only the updated text.`
    });
    return response.text || currentText;
}