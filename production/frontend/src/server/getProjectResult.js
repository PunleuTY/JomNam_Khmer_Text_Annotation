import { apiRequest } from "@/lib/api";

export const editProjectAPI = async (projectId, updatedData) => {
  try {
    console.log("editProjectAPI called with:", { projectId, updatedData });
    console.log("Sending request to:", `/projects/${projectId}`);

    const response = await apiRequest(`/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(updatedData),
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Edit API response data:", data);
    return data;
  } catch (error) {
    console.error("Error in editProjectAPI:", error);
    throw error;
  }
};
