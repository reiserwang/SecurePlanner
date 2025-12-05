export interface DeviceSpec {
  id: string;
  name: string;
  type: 'camera' | 'sensor' | 'detector';
  icon: string; // SVG path d
  color: string;
  specs: {
    description: string;
    viewAngle?: number; // degrees
    range?: number; // meters
    resolution?: string;
    mountType?: 'wall' | 'ceiling' | 'surface';
  };
}

export interface Placement {
  id: string;
  deviceId: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  orientation?: number; // degrees 0-360, 0=North(Up)
  reason: string;
}

export interface PlacementResponse {
  placements: Placement[];
  analysis: string;
}

export enum SecurityStrategy {
  HIGHEST_SECURITY = 'HIGHEST_SECURITY',
  COST_EFFECTIVE = 'COST_EFFECTIVE',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isPlacementUpdate?: boolean;
}

export interface SavedProject {
  name?: string; // User-friendly name
  timestamp: string;
  base64Data: string;
  placements: Placement[];
  strategy: SecurityStrategy;
  chatHistory: ChatMessage[];
  analysisText: string;
}