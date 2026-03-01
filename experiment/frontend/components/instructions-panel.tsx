'use client'

import React from 'react'

export function InstructionsPanel() {
  return (
    <div className="rounded-lg bg-blue-50 p-6 border-l-4 border-blue-400">
      <div className="flex gap-3">
        <span className="text-2xl">📝</span>
        <div>
          <h3 className="font-bold text-gray-800 mb-2">Instructions:</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Upload an image containing Khmer text</li>
            <li>• Select annotation mode (Line or Word level)</li>
            <li>• Click and drag to draw bounding boxes around text</li>
            <li>• Type the Khmer text in the annotation panel</li>
            <li>• Export annotations in JSON, COCO, or PaddleOCR format</li>
            <li>• Click on annotations to select/edit them</li>
            <li>• Use Delete button to remove annotations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
