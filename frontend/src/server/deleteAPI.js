import { apiRequest } from "@/lib/api";

export const deleteProjectAPI = async (projectId) => {
  try {
    const res = await apiRequest(`/projects/${projectId}`, {
      method: "DELETE",
    });

    // Some APIs return 204 No Content for successful deletes
    if (res.status === 204) {
      return { success: true, message: "Project deleted successfully" };
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `HTTP ${res.status}: ${res.statusText}`);
    }
    return data; // Return response data (e.g., success message)
  } catch (e) {
    console.error("deleteProjectAPI error:", e);
    throw e; // Re-throw so the calling component can handle the error
  }
};
