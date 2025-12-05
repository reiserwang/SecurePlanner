import { GoogleGenAI, Type } from "@google/genai";
import { DEVICE_CATALOG } from './deviceCatalog';
import { PlacementResponse, SecurityStrategy } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const SYSTEM_INSTRUCTION = `
You are an expert Security Engineer specializing in physical security system design.
Your task is to analyze floor plan images and recommend security device placements based on specific device metadata and physical constraints.

Rules:
1. **Physical Constraints**: 
   - Cameras cannot see through walls.
   - Motion sensors should not face windows directly if possible to avoid false alarms, but must cover entry paths.
   - Door sensors go on doors/windows.
   - Ceiling cameras need a central position for max coverage.
2. **Device Catalog**:
   Refer to the provided JSON list of available devices. ONLY use device IDs from this list.
3. **Coordinates**:
   Provide positions as percentages of the image width (x) and height (y). 0,0 is top-left, 100,100 is bottom-right.
4. **Strategy**:
   - "HIGHEST_SECURITY": Cover ALL blind spots, all windows, all doors. Redundancy is acceptable.
   - "COST_EFFECTIVE": Cover main entry points and high-traffic corridors only. Minimize device count.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.STRING,
      description: "A brief analysis of the floor plan (rooms identified, vulnerabilities).",
    },
    placements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique ID for this specific placement instance." },
          deviceId: { type: Type.STRING, description: "The ID of the device from the catalog." },
          x: { type: Type.NUMBER, description: "X coordinate percentage (0-100)." },
          y: { type: Type.NUMBER, description: "Y coordinate percentage (0-100)." },
          reason: { type: Type.STRING, description: "Short reason for this placement." },
        },
        required: ["id", "deviceId", "x", "y", "reason"],
      },
    },
  },
  required: ["analysis", "placements"],
};

export const analyzeFloorPlan = async (
  imageBase64: string,
  strategy: SecurityStrategy,
  promptText: string = ""
): Promise<PlacementResponse> => {
  
  const catalogStr = JSON.stringify(DEVICE_CATALOG.map(d => ({
    id: d.id,
    name: d.name,
    type: d.type,
    specs: d.specs
  })));

  const fullPrompt = `
    Here is the floor plan.
    Current Strategy: ${strategy}
    Device Catalog: ${catalogStr}
    
    User Request: ${promptText || "Analyze this floor plan and recommend device placements."}
    
    Return a JSON object with the analysis and list of placements.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
          { text: fullPrompt }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as PlacementResponse;

  } catch (error) {
    console.error("Error analyzing floor plan:", error);
    throw error;
  }
};

export const refinePlacements = async (
  imageBase64: string,
  currentPlacements: any[],
  chatHistory: any[],
  userMessage: string
): Promise<PlacementResponse> => {
   const catalogStr = JSON.stringify(DEVICE_CATALOG.map(d => ({
    id: d.id,
    name: d.name,
    specs: d.specs
  })));

  const fullPrompt = `
    This is a follow-up request.
    
    Device Catalog: ${catalogStr}
    Current Placements: ${JSON.stringify(currentPlacements)}
    
    User Feedback: "${userMessage}"
    
    Update the placements based on the user's feedback. If the user asks to remove something, remove it. If they ask to add, add it using the catalog.
    Maintain the JSON structure.
  `;

  // Construct history for context (simplified)
  // In a real app, we might pass the full chat history object structure supported by the SDK
  // Here we just append the image again to ensure context is fresh for the stateless call or use multi-turn chat
  // For simplicity in this demo, we re-send image + context as a single turn "refinement" request
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
          { text: fullPrompt }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as PlacementResponse;

  } catch (error) {
    console.error("Error refining placements:", error);
    throw error;
  }
}
