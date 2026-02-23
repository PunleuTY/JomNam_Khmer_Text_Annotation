import { apiRequest } from "@/lib/api";

export const getResultById = async (id) => {
  try {
    const response = await apiRequest(`/results/${id}`, {
      method: "GET",
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
    console.error("Error fetching result by ID:", error);
    return { success: false, error: error?.message || String(error) };
  }
};
