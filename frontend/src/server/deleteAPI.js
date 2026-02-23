import { apiRequest } from "@/lib/api";

export const deleteProjectAPI = async (projectId) => {
  try {
    const res = await apiRequest(`/projects/${projectId}`, {
      method: "DELETE",
    });

    if (res.status === 204) {
      return {
        success: true,
        data: null,
        message: "Project deleted successfully",
      };
    }

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
    console.error("deleteProjectAPI error:", e);
    return { success: false, error: e?.message || String(e) };
  }
};
