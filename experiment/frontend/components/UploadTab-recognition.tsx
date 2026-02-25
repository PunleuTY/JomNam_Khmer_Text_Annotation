"use client";

import React, { useRef } from "react";
import { Upload } from "lucide-react";
import { useOcrStore } from "@/store/ocrStore-recognition";
import { Button } from "@/components/ui/Recognition/button";

export function UploadTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addImages } = useOcrStore();

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === "image/png" || file.type === "image/jpeg") {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      addImages(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center mb-2">
          Upload Your Image
        </h2>
        <p className="text-gray-600 text-center mb-8">
          Upload a PNG or JPG images
        </p>

        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto mb-4 text-blue-500" size={48} />
          <h3 className="text-xl font-semibold mb-2">Upload Image</h3>
          <p className="text-gray-600 mb-4">
            Drag and drop your PNG or JPG image here, or click to select
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Select Image
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
