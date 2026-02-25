"use client";

import React, { useState } from "react";
import { useOcrStore } from "@/store/ocrStore-recognition";
import {
  extractTextFromImage,
  AVAILABLE_MODELS,
  AVAILABLE_FONTS,
  IMAGE_TYPE_OPTIONS,
} from "@/lib/ocrApi-recognition";
import { Button } from "@/components/ui/Recognition/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Recognition/select";

export function ExtractTab() {
  const {
    uploadedImages,
    selectedImageId,
    selectedModel,
    selectedFont,
    extractedResults,
    setSelectedImageId,
    setSelectedModel,
    setSelectedFont,
    addExtractedResult,
  } = useOcrStore();

  const [isExtracting, setIsExtracting] = useState(false);
  const [imageType, setImageType] = useState("Scanned Text");
  const [selectedFont2, setSelectedFont2] = useState("Khmer");

  const selectedImage = uploadedImages.find(
    (img) => img.id === selectedImageId,
  );
  const currentExtractedText = extractedResults.find(
    (result) => result.imageId === selectedImageId,
  )?.extractedText;

  const handleExtractText = async () => {
    if (!selectedImage || !selectedModel || !selectedFont2) {
      alert("Please select an image, model, and font");
      return;
    }

    setIsExtracting(true);
    try {
      const { text, inference_speed } = await extractTextFromImage(
        selectedImage.file,
        selectedModel,
        selectedFont2,
      );

      addExtractedResult({
        imageId: selectedImage.id,
        imageName: selectedImage.name,
        extractedText: text,
        recognitionModel: selectedModel,
        inference_speed,
      });
    } catch (error) {
      console.error("[v0] Extraction error:", error);
      alert("Error extracting text. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="flex gap-6">
      {/* Left Panel - Image List */}
      <div className="w-1/4 border-r pr-4">
        <h3 className="font-semibold mb-4 text-sm">Images</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {uploadedImages.map((image) => (
            <div
              key={image.id}
              onClick={() => setSelectedImageId(image.id)}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                selectedImageId === image.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <img
                src={image.preview}
                alt={image.name}
                className="w-full h-24 object-cover rounded mb-2"
              />
              <p className="text-xs font-medium truncate">{image.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Preview and Controls */}
      <div className="flex-1">
        {selectedImage ? (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <img
                src={selectedImage.preview}
                alt="preview"
                className="max-h-80 w-full object-contain"
              />
            </div>

            {/* Extracted Text Display */}
            {currentExtractedText && (
              <div className="border rounded-lg p-4 bg-white">
                <p className="text-sm font-semibold mb-2">Extracted Text:</p>
                <div className="bg-gray-50 p-3 rounded text-sm max-h-32 overflow-y-auto text-gray-800 leading-relaxed">
                  {currentExtractedText}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    OCR Model
                  </label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_MODELS.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Font</label>
                  <Select
                    value={selectedFont2}
                    onValueChange={setSelectedFont2}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_FONTS.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">
                    Type of Image
                  </label>
                  <Select value={imageType} onValueChange={setImageType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleExtractText}
                disabled={isExtracting || !selectedImage}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isExtracting ? "Extracting..." : "Extract Text (OCR)"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96 text-gray-400">
            Select an image to view and extract text
          </div>
        )}
      </div>
    </div>
  );
}
