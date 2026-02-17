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
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in editProjectAPI:", error);
    throw error;
  }
};
