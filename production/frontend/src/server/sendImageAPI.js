import { apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/authUtils";

const BACKEND_UPLOAD_URL = `${import.meta.env.VITE_BACKEND_BASE_ENDPOINT}/images/upload`;
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_ENDPOINT;

// Upload images to ML backend
export const uploadImages = async (projectId, files, annotations) => {
  if (!files || files.length === 0) return null;

  const formData = new FormData();
  formData.append("project_id", projectId);
  files.forEach((file) => formData.append("images", file));
  formData.append("annotations", JSON.stringify(annotations));

  console.log("upload to project", files, projectId);
  console.log("data annotation go to", annotations);

  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(BACKEND_UPLOAD_URL, {
    method: "POST",
    body: formData,
    headers,
  });
  try {
    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        error: `Failed to upload images: ${text}`,
        status: res.status,
      };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error("uploadImages error:", err);
    return { success: false, error: err?.message || String(err) };
  }
};

// Trigger OCR for an existing image by calling the backend OCR endpoint
export const triggerOCR = async (imageId, boxes, { recognitionModel = "tesseract" } = {}) => {
  if (!imageId) return null;

  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    const res = await apiRequest(`/images/${imageId}/ocr`, {
      method: "POST",
      body: JSON.stringify({ annotations: boxes, recognition_model: recognitionModel }),
      headers,
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        error: `Failed to trigger OCR: ${text}`,
        status: res.status,
      };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error("triggerOCR error:", err);
    return { success: false, error: err?.message || String(err) };
  }
};

// Trigger ML_V4 auto-detect for an image (DocTR detection + optional text extraction)
export const triggerAutoDetect = async (imageId, { mode = "word", extractText = false, detectionModel = "doctr", recognitionModel = "tesseract" } = {}) => {
  if (!imageId) return null;

  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    const res = await apiRequest(`/images/${imageId}/auto-detect`, {
      method: "POST",
      body: JSON.stringify({
        mode,
        extract_text: extractText,
        detection_model: detectionModel,
        recognition_model: recognitionModel,
      }),
      headers,
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        error: `Failed to auto-detect: ${text}`,
        status: res.status,
      };
    }

    const data = await res.json();
    return { success: data.success !== false, data };
  } catch (err) {
    console.error("triggerAutoDetect error:", err);
    return { success: false, error: err?.message || String(err) };
  }
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
    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        error: `HTTP error: ${res.status} - ${text}`,
        status: res.status,
      };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error("Error saving ground truth:", err);
    return { success: false, error: err?.message || String(err) };
  }
};
