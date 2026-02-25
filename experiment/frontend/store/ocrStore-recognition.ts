import { create } from "zustand";

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  name: string;
}

export interface ExtractionResult {
  imageId: string;
  imageName: string;
  extractedText: string;
  recognitionModel: string;
  inference_speed?: number;
}

export interface EvaluationResult {
  imageId: string;
  imageName: string;
  recognitionModel: string;
  extractedText: string;
  groundTruth: string;
  cer?: number;
  wer?: number;
  inference_speed?: number;
}

interface OcrStore {
  // Upload state
  uploadedImages: UploadedImage[];
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;

  // Extract state
  selectedModel: string;
  selectedFont: string;
  selectedImageId: string | null;
  extractedResults: ExtractionResult[];
  setSelectedModel: (model: string) => void;
  setSelectedFont: (font: string) => void;
  setSelectedImageId: (id: string | null) => void;
  addExtractedResult: (result: ExtractionResult) => void;
  clearExtractedResults: () => void;

  // Results state
  evaluationResults: EvaluationResult[];
  groundTruths: Record<string, string>;
  setGroundTruth: (imageId: string, text: string) => void;
  addEvaluationResult: (result: EvaluationResult) => void;
  clearEvaluationResults: () => void;

  // Current tab
  currentTab: "upload" | "extract" | "results";
  setCurrentTab: (tab: "upload" | "extract" | "results") => void;
}

export const useOcrStore = create<OcrStore>((set) => ({
  // Upload state
  uploadedImages: [],
  addImages: (files: File[]) => {
    const newImages = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    set((state) => ({
      uploadedImages: [...state.uploadedImages, ...newImages],
    }));
  },
  removeImage: (id: string) => {
    set((state) => {
      const image = state.uploadedImages.find((img) => img.id === id);
      if (image) URL.revokeObjectURL(image.preview);
      return {
        uploadedImages: state.uploadedImages.filter((img) => img.id !== id),
      };
    });
  },
  clearImages: () =>
    set((state) => {
      state.uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
      return { uploadedImages: [] };
    }),

  // Extract state
  selectedModel: "KirOCR",
  selectedFont: "Khmer",
  selectedImageId: null,
  extractedResults: [],
  setSelectedModel: (model: string) => set({ selectedModel: model }),
  setSelectedFont: (font: string) => set({ selectedFont: font }),
  setSelectedImageId: (id: string | null) => set({ selectedImageId: id }),
  addExtractedResult: (result: ExtractionResult) => {
    set((state) => ({
      extractedResults: [...state.extractedResults, result],
    }));
  },
  clearExtractedResults: () => set({ extractedResults: [] }),

  // Results state
  evaluationResults: [],
  groundTruths: {},
  setGroundTruth: (imageId: string, text: string) => {
    set((state) => ({
      groundTruths: {
        ...state.groundTruths,
        [imageId]: text,
      },
    }));
  },
  addEvaluationResult: (result: EvaluationResult) => {
    set((state) => ({
      evaluationResults: [...state.evaluationResults, result],
    }));
  },
  clearEvaluationResults: () => set({ evaluationResults: [] }),

  // Current tab
  currentTab: "upload",
  setCurrentTab: (tab: "upload" | "extract" | "results") =>
    set({ currentTab: tab }),
}));
