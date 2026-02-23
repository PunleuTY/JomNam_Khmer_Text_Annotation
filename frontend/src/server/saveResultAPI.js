import { apiRequest } from "@/lib/api";

// Load all projects
export const loadProjectAPI = async () => {
  try {
    const res = await apiRequest("/projects");
    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        error: `HTTP error! status: ${res.status} - ${text}`,
        status: res.status,
      };
    }
    const data = await res.json();
    const payload =
      data && Object.prototype.hasOwnProperty.call(data, "projects")
        ? data.projects
        : data;
    return { success: true, data: payload };
  } catch (e) {
    console.error("Failed to load projects:", e.message);
    return { success: false, error: e?.message || String(e) };
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
      return {
        success: false,
        error: data?.message || `HTTP ${res.status}: ${res.statusText}`,
        status: res.status,
      };
    }
    return { success: true, data };
  } catch (e) {
    console.error("createProjectAPI error:", e);
    return { success: false, error: e?.message || String(e) };
  }
};

// Get all images for a project
export const getImageByProjectAPI = async (id) => {
  try {
    const res = await apiRequest(`/projects/${id}/images`, {
      method: "GET",
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        error: `HTTP error! Status: ${res.status} - ${text}`,
        status: res.status,
      };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (e) {
    console.error("Failed to fetch project images:", e.message);
    return { success: false, error: e?.message || String(e) };
  }
};

// Get project stats (total images, annotated images)
export const getProjectStatsAPI = async (id) => {
  try {
    const res = await apiRequest(`/projects/${id}/stats`, {
      method: "GET",
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        error: `HTTP error! Status: ${res.status} - ${text}`,
        status: res.status,
      };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (e) {
    console.error("Failed to fetch project stats:", e.message);
    return { success: false, error: e?.message || String(e) };
  }
};

// Get total images across all projects
export const getTotalImagesAllProjectsAPI = async () => {
  try {
    const res = await apiRequest("/projects/stats/total", {
      method: "GET",
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        error: `HTTP error! Status: ${res.status} - ${text}`,
        status: res.status,
      };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (e) {
    console.error("Failed to fetch total images stats:", e.message);
    return { success: false, error: e?.message || String(e) };
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
      const text = await response.text();
      return {
        success: false,
        error: `HTTP error! status: ${response.status} - ${text}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error saving result:", error);
    return { success: false, error: error?.message || String(error) };
  }
};

// Get project details by ID
export const getProjectByIdAPI = async (id) => {
  try {
    const res = await apiRequest(`/projects/${id}`, {
      method: "GET",
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        error: `HTTP error! Status: ${res.status} - ${text}`,
        status: res.status,
      };
    }

    const data = await res.json();
    const payload =
      data && Object.prototype.hasOwnProperty.call(data, "project")
        ? data.project
        : data;
    return { success: true, data: payload };
  } catch (e) {
    console.error("Failed to fetch project details:", e.message);
    return { success: false, error: e?.message || String(e) };
  }
};
