# SecurePlan AI 

**SecurePlan AI** is an intelligent security system design tool that leverages Google's **Gemini 2.5 Flash** model to analyze floor plans and automatically recommend optimal placements for security devices (cameras, sensors, detectors).

It combines computer vision capabilities with structured data generation to provide professional-grade security layouts in seconds, complete with interactive visualizations of fields of view (FOV) and coverage zones.

---

## Key Features

*   **AI Floor Plan Analysis**: Upload any 2D floor plan image. The AI identifies rooms, entry points, and vulnerabilities to suggest device placements.
*   **Strategic Modes**: Choose between **Highest Security** (maximum coverage) or **Cost Effective** (choke-point focus).
*   **Interactive Visualization**:
    *   **Field of View (FOV)**: Visual cones indicating camera direction and coverage angle.
    *   **Device Orientation**: Icons rotate to match the specific wall or corner mounting angle.
    *   **Tooltips**: Hover over devices to see specific models and the AI's reasoning for that placement.
*   **Conversational Refinement**: Use the built-in chat to ask the AI to adjust the plan (e.g., "Remove cameras from the bedroom," "Add a glass break sensor to the living room").
*   **Project Library**: Save and load projects locally using a browser-based persistent storage system.
*   **Export**: Download projects as a ZIP file containing the JSON data and a high-resolution screenshot of the annotated plan.

---

## Technical Architecture

The application is built as a **Single Page Application (SPA)** using React and TypeScript, designed with a "Backend-as-a-Module" pattern to simulate a cloud architecture within the browser client.

### 1. The "Backend" Facade (`backend/`)
To ensure clean separation of concerns, all logic related to AI, Data Persistence, and Business Rules is encapsulated in the `backend/` directory. The Frontend **never** accesses external APIs directly; it goes through the `API` facade exported in `backend/index.ts`.

*   **`backend/ai.ts`**: The core intelligence layer.
    *   **Model**: Uses `gemini-2.5-flash` for high-speed multimodal reasoning.
    *   **Structured Output**: Enforces a strict **JSON Schema** to guarantee the LLM returns machine-readable coordinates (`x`, `y`), `orientation` (0-360°), and device IDs.
    *   **System Instructions**: Contains strict engineering prompts regarding privacy (no cameras in bathrooms) and physical constraints (cameras can't see through walls).
*   **`backend/library.ts`**: Manages data persistence using the browser's `localStorage` to simulate a database.
*   **`backend/devices.ts`**: The "Source of Truth" for device metadata (SVG icons, view angles, ranges).

### 2. Frontend Visualization (`frontend/`)
*   **`FloorPlanCanvas.tsx`**: The core rendering engine.
    *   **Responsive Mapping**: Maps the AI's percentage-based coordinates (0-100%) to the actual pixel dimensions of the uploaded image.
    *   **Geometry Calculation**: Dynamically generates SVG paths for camera cones based on the device's `viewAngle` (e.g., 120° vs 360°) and `orientation`.
    *   **CSS Transformations**: Handles the rotation of device icons and cones to ensure perfect visual alignment with walls.

---

## AI Implementation Details

The core of SecurePlan AI relies on **Multimodal Prompting** with **Schema Enforcement**.

### The Schema
We do not parse raw text. The Gemini API is configured to return a strict JSON object:

```typescript
interface PlacementResponse {
  analysis: string; // Textual explanation of the strategy
  placements: {
    id: string;
    deviceId: string; // Must match catalog ID (e.g., 'cam_120_wall')
    x: number;        // 0-100%
    y: number;        // 0-100%
    orientation: number; // 0=North, 90=East
    reason: string;
  }[];
}
```

### Contextual Refinement
When a user asks to change the plan (e.g., "Move the kitchen camera to the corner"), the system sends:
1.  The original image.
2.  The *current* JSON state of placements.
3.  The user's text prompt.
4.  The Device Catalog (so the AI knows what hardware is available).

This allows the AI to act as a state-machine, receiving the current state and computing the next valid state.

---

## Project Structure

```
/
├── backend/               # Centralized logic layer
│   ├── ai.ts              # Gemini API integration & Prompt Engineering
│   ├── db.ts              # Low-level local storage wrapper
│   ├── devices.ts         # Device Catalog definitions
│   ├── library.ts         # Project Library service
│   └── index.ts           # Unified API export (Facade)
│
├── frontend/              # UI Layer
│   ├── components/
│   │   └── FloorPlanCanvas.tsx  # Main visualization component
│   └── App.tsx            # Main application controller
│
├── types.ts               # Shared TypeScript interfaces
└── index.tsx              # React entry point
```

---

## Setup & Usage

1.  **API Key**: The application requires a valid Google GenAI API key in the environment (`process.env.API_KEY`).
2.  **Upload**: Click "Upload Floor Plan" and select a clean 2D image (JPG/PNG).
3.  **Analyze**: Select a strategy and click "Generate Plan".
4.  **Refine**: Use the chat box to modify the results naturally.
5.  **Save**: Save the project to your local library or download it.

---

## Future Roadmap

1.  **3D Projection**: Use the coordinate data to generate a simple 3D mesh of the camera cones.
2.  **RAG Integration**: Upload PDF manuals for specific devices to answer technical questions in the chat.
3.  **Cost Estimation**: Calculate total system cost based on the number and type of devices placed.
