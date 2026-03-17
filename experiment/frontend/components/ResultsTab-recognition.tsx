"use client";

import React, { useState } from "react";
import { useOcrStore } from "@/store/ocrStore-recognition";
import { evaluateExtraction } from "@/lib/ocrApi-recognition";
import { Button } from "@/components/ui/Recognition/button";
import { Textarea } from "@/components/ui/Recognition/textarea";

export function ResultsTab() {
  const {
    uploadedImages,
    extractedResults,
    evaluationResults,
    groundTruths,
    setGroundTruth,
    addEvaluationResult,
  } = useOcrStore();

  const [isEvaluating, setIsEvaluating] = useState<string | null>(null);

  const handleEvaluate = async (imageId: string, extractedText: string) => {
    const groundTruth = groundTruths[imageId];

    if (!groundTruth || groundTruth.trim() === "") {
      alert("Please enter ground truth before evaluating");
      return;
    }

    setIsEvaluating(imageId);
    try {
      const { cer, wer, inference_speed } = await evaluateExtraction(
        extractedText,
        groundTruth,
        "KirOCR",
      );

      const image = uploadedImages.find((img) => img.id === imageId);
      addEvaluationResult({
        imageId,
        imageName: image?.name || "Unknown",
        recognitionModel: "KirOCR",
        extractedText,
        groundTruth,
        cer,
        wer,
        inference_speed,
      });
    } catch (error) {
      console.error("[v0] Evaluation error:", error);
      alert("Error evaluating extraction. Please try again.");
    } finally {
      setIsEvaluating(null);
    }
  };

  const handleExport = () => {
    if (evaluationResults.length === 0) {
      alert("No evaluation results to export");
      return;
    }

    const csv = [
      ["Image", "Recognition Model", "CER", "WER", "Inference Speed (ms)"],
      ...evaluationResults.map((result) => [
        result.imageName,
        result.recognitionModel,
        (result.cer || 0).toFixed(4),
        (result.wer || 0).toFixed(4),
        (result.inference_speed || 0).toFixed(2),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ocr_results.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Instructions:</strong> Please input Ground Truth Before Start
          Evaluate The Performance Of The Recognition Model.
        </p>
      </div>

      <div className="space-y-6">
        {extractedResults.map((result, index) => {
          const evaluation = evaluationResults.find(
            (e) => e.imageId === result.imageId,
          );
          const groundTruth = groundTruths[result.imageId] || "";

          return (
            <div
              key={`${result.imageId}-${index}`}
              className="border rounded-lg p-6 space-y-4"
            >
              {/* Result Header */}
              <div>
                <h3 className="font-semibold text-lg">
                  Result of {result.imageName}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Recognition Model:{" "}
                  <span className="font-medium">{result.recognitionModel}</span>
                </p>
              </div>

              {/* Extracted Text */}
              <div>
                <label className="text-sm font-medium block mb-2">
                  Extracted Text
                </label>
                <div className="bg-gray-50 p-3 rounded text-sm text-gray-800 max-h-24 overflow-y-auto border border-gray-200">
                  {result.extractedText}
                </div>
              </div>

              {/* Ground Truth Input */}
              <div>
                <label className="text-sm font-medium block mb-2">
                  Ground Truth
                </label>
                <Textarea
                  value={groundTruth}
                  onChange={(e) =>
                    setGroundTruth(result.imageId, e.target.value)
                  }
                  placeholder="Enter the correct text for this image..."
                  className="w-full h-24 border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Metrics Display */}
              {evaluation && (
                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded">
                  <div>
                    <p className="text-xs font-medium text-gray-600">
                      CER (Character Error Rate)
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {(evaluation.cer || 0).toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">
                      WER (Word Error Rate)
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {(evaluation.wer || 0).toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">
                      Reference Speed (ms)
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {(evaluation.inference_speed || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Evaluate Button */}
              <Button
                onClick={() =>
                  handleEvaluate(result.imageId, result.extractedText)
                }
                disabled={
                  isEvaluating === result.imageId || !groundTruth.trim()
                }
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isEvaluating === result.imageId
                  ? "Evaluating..."
                  : "Start Evaluate"}
              </Button>
            </div>
          );
        })}
      </div>

      {extractedResults.length === 0 && (
        <div className="flex items-center justify-center h-48 text-gray-400 border rounded-lg">
          No extracted results yet. Please extract text from images first.
        </div>
      )}

      {/* Export Section */}
      {evaluationResults.length > 0 && (
        <div className="flex gap-3 justify-center pt-4 border-t">
          <Button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Export Result (JSON)
          </Button>
          <Button
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50"
          >
            Save
          </Button>
        </div>
      )}

      {/* Overall Results Summary */}
      {evaluationResults.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="font-semibold text-lg mb-4">Overall Result</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm">
              Image Type: <span className="font-medium">Scanned Text</span>
            </p>
            <p className="text-sm">
              Recognition Model: <span className="font-medium">KirOCR</span>
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div>
                <p className="text-xs font-medium text-gray-600">Avg CER</p>
                <p className="text-lg font-bold">
                  {(
                    evaluationResults.reduce(
                      (sum, r) => sum + (r.cer || 0),
                      0,
                    ) / evaluationResults.length
                  ).toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Avg WER</p>
                <p className="text-lg font-bold">
                  {(
                    evaluationResults.reduce(
                      (sum, r) => sum + (r.wer || 0),
                      0,
                    ) / evaluationResults.length
                  ).toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Avg Speed (ms)
                </p>
                <p className="text-lg font-bold">
                  {(
                    evaluationResults.reduce(
                      (sum, r) => sum + (r.inference_speed || 0),
                      0,
                    ) / evaluationResults.length
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
