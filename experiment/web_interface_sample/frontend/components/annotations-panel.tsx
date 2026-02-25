"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Detection/button";
import { Textarea } from "@/components/ui/Detection/textarea";
import { Trash2 } from "lucide-react";

interface Annotation {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  mode: "line" | "word";
}

interface Props {
  annotations: Annotation[];
  onUpdateText: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

export function AnnotationsPanel({
  annotations,
  onUpdateText,
  onDelete,
}: Props) {
  const lineAnnotations = annotations.filter((a) => a.mode === "line");
  const wordAnnotations = annotations.filter((a) => a.mode === "word");

  const renderAnnotationItem = (
    anno: Annotation,
    index: number,
    label: string,
  ) => (
    <div key={anno.id} className="border border-gray-300 rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <span
          className="inline-block px-2 py-1 text-xs font-bold text-white rounded"
          style={{
            backgroundColor: anno.mode === "line" ? "#7C3AED" : "#6366F1",
          }}
        >
          {label} #{index + 1}
        </span>
        <Button
          onClick={() => onDelete(anno.id)}
          variant="destructive"
          size="sm"
          className="h-6 px-2"
        >
          Delete
        </Button>
      </div>
      <Textarea
        value={anno.text}
        onChange={(e) => onUpdateText(anno.id, e.target.value)}
        placeholder={`Enter Khmer text here... (${anno.mode === "line" ? "Line" : "Word"})`}
        className="mb-3 min-h-16"
      />
      <div className="text-xs text-gray-500">
        x: {anno.x}, y: {anno.y}, w: {anno.width}, h: {anno.height}
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Annotations</h2>

      {annotations.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No annotations yet</p>
          <p className="text-sm">Draw boxes on the canvas to start</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {lineAnnotations.map((anno, idx) =>
            renderAnnotationItem(anno, idx, "LINE"),
          )}
          {wordAnnotations.map((anno, idx) =>
            renderAnnotationItem(anno, idx, "WORD"),
          )}
        </div>
      )}

      {/* Statistics */}
      {annotations.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <h3 className="font-semibold mb-3">Statistics</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Annotations:</span>
              <span className="font-bold">{annotations.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Lines:</span>
              <span className="font-bold">{lineAnnotations.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Words:</span>
              <span className="font-bold">{wordAnnotations.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
