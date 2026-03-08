import { apiRequest } from "@/lib/api";

export const editProjectAPI = async (projectId, updatedData) => {
  try {
    const response = await apiRequest(`/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return {
        success: false,
        error: `HTTP error! status: ${response.status} - ${errorText}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error in editProjectAPI:", error);
    return { success: false, error: error?.message || String(error) };
  }
};
