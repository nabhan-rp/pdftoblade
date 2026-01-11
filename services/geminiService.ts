import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Analyzes a document image or PDF to extract structure and convert to a template format.
 * Uses Gemini 3 Flash for speed and efficiency.
 */
export const analyzeDocumentImage = async (base64Data: string, mimeType: string = 'image/jpeg'): Promise<AnalysisResponse> => {
  if (!apiKey) throw new Error("API Key missing");

  const prompt = `
    Analyze this document image(s) which is likely a formal letter. 
    I need you to extract the content and structure to create a Laravel Blade template.
    
    1. Identify the Header/Kop Surat info.
    2. Extract the MAIN BODY content as HTML. 
       - CRITICAL: If there are TABLES, strictly use HTML <table>, <tr>, <td> tags with border styles.
       - Detect dynamic parts (names, dates, numbers, recipients) and replace them with {{ $variable }}.
    3. CHECK FOR ATTACHMENTS (Lampiran):
       - If the document has a second page or a section labeled "Lampiran", extract that content separately into 'attachmentContent'.
       - Maintain any tables found in the attachment exactly as HTML tables.
    4. Identify signature area information.

    Return the result strictly as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            institutionName: { type: Type.STRING },
            institutionAddress: { type: Type.STRING },
            htmlContent: { type: Type.STRING, description: "Main letter body HTML. Use <table> for tabular data." },
            attachmentContent: { type: Type.STRING, description: "Content of attachments/lampiran if present. Use <table> for lists." },
            detectedVariables: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING },
                  label: { type: Type.STRING },
                  defaultValue: { type: Type.STRING }
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

export const generateLogo = async (prompt: string, aspectRatio: string): Promise<string> => {
    if (!apiKey) throw new Error("API Key missing");
    
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
                    aspectRatio: validRatio as any,
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