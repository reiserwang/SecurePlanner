// This file serves as the unified interface for the "Backend"
// The Frontend should only import from here.

import * as AI from './ai';
import { ProjectLibrary } from './library';
import * as Devices from './devices';

// Exporting individual sub-modules for structured access
export const API = {
  AI: {
    analyze: AI.analyzeFloorPlan,
    refine: AI.refinePlacements,
    utils: {
        fileToBase64: AI.fileToGenerativePart
    }
  },
  DB: {
    getProjects: ProjectLibrary.getAll,
    saveProject: ProjectLibrary.save,
    deleteProject: ProjectLibrary.delete,
    getProject: ProjectLibrary.get
  },
  Catalog: {
    getAll: Devices.DEVICE_CATALOG
  }
};
