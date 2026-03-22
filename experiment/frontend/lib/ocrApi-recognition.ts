import {
  ExtractionResult,
  EvaluationResult,
} from "@/store/ocrStore-recognition";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function extractTextFromImage(
  imageFile: File,
  model: string,
  font: string,
): Promise<{ text: string; inference_speed?: number }> {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("model_name", model);
    formData.append("font", font);

    console.log("[recognition] Extracting text from:", imageFile.name);

    const response = await fetch(`${BACKEND_URL}/extract-text`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Extraction failed");
    }

    return {
      text: data.text || "",
      inference_speed: data.inference_speed,
    };
  } catch (error) {
    console.error("[recognition] Error extracting text:", error);
    throw error;
  }
}

export async function evaluateExtraction(
  extractedText: string,
  groundTruth: string,
  model: string,
  imageFile?: File,
): Promise<{ cer: number; wer: number; inference_speed?: number }> {
  try {
    console.log("[recognition] Evaluating extraction");

    const response = await fetch(`${BACKEND_URL}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        extracted_text: extractedText,
        ground_truth: groundTruth,
        model_name: model,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();

    return {
      cer: data.cer ?? 0,
      wer: data.wer ?? 0,
      inference_speed: data.inference_speed,
    };
  } catch (error) {
    console.error("[recognition] Error evaluating extraction:", error);
    throw error;
  }
}

// Export available models and fonts
export const AVAILABLE_MODELS = ["KirOCR", "PaddleOCR", "EasyOCR", "Tesseract"];

export const AVAILABLE_FONTS = ["Khmer", "Khmer New", "KhmerUI", "Bokor"];

export const IMAGE_TYPE_OPTIONS = [
  "Scanned Text",
  "Handwritten Text",
  "Digital Text",
  "Mixed",
];
