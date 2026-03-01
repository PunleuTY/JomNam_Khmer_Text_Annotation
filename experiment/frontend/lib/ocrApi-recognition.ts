import {
  ExtractionResult,
  EvaluationResult,
} from "@/store/ocrStore-recognition";

// Placeholder for text extraction API
export async function extractTextFromImage(
  imageFile: File,
  model: string,
  font: string,
): Promise<{ text: string; inference_speed?: number }> {
  // In a real application, this would call your backend API
  try {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("model", model);
    formData.append("font", font);

    // Example API call structure:
    // const response = await fetch('/api/ocr/extract', {
    //   method: 'POST',
    //   body: formData,
    // });
    // return response.json();

    console.log("[recognition] Extracting text from:", imageFile.name);
    return {
      text: "Extracted text placeholder - implement your OCR backend",
      inference_speed: 0.5,
    };
  } catch (error) {
    console.error("[recognition] Error extracting text:", error);
    throw error;
  }
}

// Placeholder for evaluation API
export async function evaluateExtraction(
  extractedText: string,
  groundTruth: string,
  model: string,
  imageFile?: File,
): Promise<{ cer: number; wer: number; inference_speed?: number }> {
  // In a real application, this would call your backend API
  try {
    // Example API call structure:
    // const response = await fetch('/api/ocr/evaluate', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     extracted_text: extractedText,
    //     ground_truth: groundTruth,
    //     model: model,
    //   }),
    // });
    // return response.json();

    console.log("[recognition] Evaluating extraction");

    // Placeholder calculation
    const cer = Math.random() * 0.2; // Character Error Rate
    const wer = Math.random() * 0.3; // Word Error Rate

    return {
      cer,
      wer,
      inference_speed: 0.5,
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
