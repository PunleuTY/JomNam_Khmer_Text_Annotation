import { file } from "jszip";
import { toast } from "react-toastify";
import { apiRequest } from "@/lib/api";

const BACKEND_UPLOAD_URL = `${import.meta.env.VITE_ML_BASE_ENDPOINT}/images/`;
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_ENDPOINT;

// Upload images to ML backend
export const uploadImages = async (projectId, files, annotations) => {
  if (!files || files.length === 0) return null;

  const formData = new FormData();
  formData.append("project_id", projectId);
  formData.append("image", files[0]);
  formData.append("annotations", JSON.stringify(annotations));

  console.log("upload to project", files, projectId);
  console.log("data annotation go to", annotations);

  const res = await fetch(BACKEND_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload images");
  }

  return await res.json();
};

// Save ground truth annotations to backend
export const saveGroundTruth = async (
  filename,
  projectId,
  imageId,
  annotations,
) => {
  if (!annotations) return null;

  const payload = {
    filename,
    project_id: projectId,
    image_id: imageId,
    annotations,
    meta: {
      tool: "Khmer Data Annotation Tool",
      lang: "khm",
      timestamp: new Date().toISOString(),
    },
  };

  console.log("save ground truth payload", payload);

  try {
    const res = await apiRequest(`/images/save-groundtruth`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return await res.json();
  } catch (err) {
    console.error("Error saving ground truth:", err);
    toast.error("Error saving ground truth");
  }
};
