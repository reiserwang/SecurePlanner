import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DEVICE_CATALOG } from './devices';
import { PlacementResponse, SecurityStrategy, Placement, ChatMessage } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION = `
You are an expert Security Engineer specializing in physical security system design.
Your task is to analyze floor plan images and recommend security device placements based on specific device metadata and physical constraints.

Rules:
1. **Privacy & Common Sense (CRITICAL)**:
   - **NO CAMERAS IN PRIVATE AREAS**: Never place cameras in bathrooms, toilets, restrooms, or changing rooms. Use "Glass Break Sensors" or "Contact Sensors" on windows/doors in these rooms instead.
   - **Bedroom Privacy**: Be conservative with cameras in bedrooms. Prefer sensors.
   - **Entry Points**: Always cover main doors, back doors, and ground-floor windows.

2. **Physical Constraints & Orientation**: 
   - Cameras cannot see through walls.
   - **Orientation**: specificy the direction the device is facing (0-360 degrees). 0=Up(North), 90=Right(East), 180=Down(South), 270=Left(West).
   - Wall-mounted cameras (120° FOV) must be placed on walls and angled inward to cover the room.
   - Corner placements are optimal for 90-120° FOV sensors/cameras to maximize room coverage.
   - Door sensors go on the frame.
   - Ceiling cameras (360° FOV) need a central position.

3. **Device Catalog**:
   Refer to the provided JSON list of available devices. ONLY use device IDs from this list.

4. **Coordinates**:
   Provide positions as percentages of the image width (x) and height (y). 0,0 is top-left, 100,100 is bottom-right.

5. **Strategy**:
   - "HIGHEST_SECURITY": Maximize coverage area. Overlap fields of view (FOV) to eliminate blind spots. Cover all windows and doors.
   - "COST_EFFECTIVE": Focus on "choke points" (hallways, entries). Accept some blind spots in low-risk corners.
`;

const RESPONSE_SCHEMA: Schema = {
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
          orientation: { type: Type.NUMBER, description: "Facing direction in degrees (0=Up, 90=Right, etc). Required for directional devices." },
          reason: { type: Type.STRING, description: "Short reason for this placement." },
        },
        required: ["id", "deviceId", "x", "y", "orientation", "reason"],
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
    
    Return a JSON object with the analysis and list of placements. Ensure you provide 'orientation' for every device.
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
  currentPlacements: Placement[],
  chatHistory: ChatMessage[],
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
    Maintain the JSON structure and ensure orientation is correct for new/updated devices.
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
    console.error("Error refining placements:", error);
    throw error;
  }
};

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
