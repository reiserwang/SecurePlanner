import { SavedProject } from '../types';

const STORAGE_KEY = 'secureplan_project_library';

/**
 * Backend Service for managing the Project Library.
 * Handles CRUD operations for floor plan security projects.
 */
export const ProjectLibrary = {
  
  /**
   * Retrieves all saved projects from the backend storage.
   */
  getAll: (): SavedProject[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Library: Failed to load projects", e);
      return [];
    }
  },

  /**
   * Saves a project to the library. Updates if timestamp matches, otherwise inserts new.
   */
  save: (project: SavedProject): void => {
    const projects = ProjectLibrary.getAll();
    
    const index = projects.findIndex(p => p.timestamp === project.timestamp);
    
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.unshift(project);
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
         throw new Error("Library is full. Please delete old projects.");
      }
      throw e;
    }
  },

  /**
   * Deletes a project by its timestamp ID.
   */
  delete: (timestamp: string): void => {
    const projects = ProjectLibrary.getAll();
    const filtered = projects.filter(p => p.timestamp !== timestamp);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  /**
   * Gets a specific project.
   */
  get: (timestamp: string): SavedProject | undefined => {
     const projects = ProjectLibrary.getAll();
     return projects.find(p => p.timestamp === timestamp);
  }
};
