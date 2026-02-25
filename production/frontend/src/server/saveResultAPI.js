import { apiRequest } from "@/lib/api";

// Load all projects
export const loadProjectAPI = async () => {
  try {
    const res = await apiRequest("/projects");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data.projects || data; // handle {projects: [...]} or direct array
  } catch (e) {
    console.error("Failed to load projects:", e.message);
    throw e;
  }
};

// Create new project
export const createProjectAPI = async (name, description) => {
  try {
    const res = await apiRequest("/projects", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `HTTP ${res.status}: ${res.statusText}`);
    }
    return data;
  } catch (e) {
    console.error("createProjectAPI error:", e);
    throw e;
  }
};

// Get all images for a project
export const getImageByProjectAPI = async (id) => {
  try {
    const res = await apiRequest(`/projects/${id}/images`, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Failed to fetch project images:", e.message);
    return null; // fallback
  }
};

// Get project stats (total images, annotated images)
export const getProjectStatsAPI = async (id) => {
  try {
    const res = await apiRequest(`/projects/${id}/stats`, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Failed to fetch project stats:", e.message);
    return null;
  }
};

// Get total images across all projects
export const getTotalImagesAllProjectsAPI = async () => {
  try {
    const res = await apiRequest("/projects/stats/total", {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const data = await res.json();
    console.log(data);
    return data; // { total_images, annotated_images }
  } catch (e) {
    console.error("Failed to fetch total images stats:", e.message);
    return null;
  }
};

// Save result
export const saveResultAPI = async (resultData) => {
  try {
    const response = await apiRequest("/results", {
      method: "POST",
      body: JSON.stringify(resultData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error saving result:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get project details by ID
export const getProjectByIdAPI = async (id) => {
  try {
    const res = await apiRequest(`/projects/${id}`, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const data = await res.json();
    return data.project || data; // handle {project: {...}} or direct object
  } catch (e) {
    console.error("Failed to fetch project details:", e.message);
    return null; // fallback
  }
};
