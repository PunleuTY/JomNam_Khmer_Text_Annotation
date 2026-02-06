import { apiRequest } from "@/lib/api";

export const getResultById = async (id) => {
  try {
    const response = await apiRequest(`/results/${id}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching result by ID:", error);
    throw error;
  }
};
