import { SavedProject } from '../types';

const STORAGE_KEY = 'secureplan_projects';

export const getSavedProjects = (): SavedProject[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load projects", e);
    return [];
  }
};

export const saveProjectToStorage = (project: SavedProject): void => {
  const projects = getSavedProjects();
  
  // Check if a project with this timestamp already exists (update) or add new
  const index = projects.findIndex(p => p.timestamp === project.timestamp);
  
  if (index >= 0) {
    projects[index] = project;
  } else {
    // Add to beginning of list
    projects.unshift(project);
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
       throw new Error("Storage full. Please delete old projects or download to computer.");
    }
    throw e;
  }
};

export const deleteProjectFromStorage = (timestamp: string): void => {
  const projects = getSavedProjects();
  const filtered = projects.filter(p => p.timestamp !== timestamp);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};