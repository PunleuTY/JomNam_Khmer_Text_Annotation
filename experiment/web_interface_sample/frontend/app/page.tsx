'use client'

import React from 'react'
import { CanvasAnnotator } from '@/components/canvas-annotator'
import { AnnotationsPanel } from '@/components/annotations-panel'
import { InstructionsPanel } from '@/components/instructions-panel'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState, useCallback, useRef } from 'react'
import { Download, Trash2, Upload } from 'lucide-react'
import { exportToJSON, exportToCOCO, exportToPaddleOCR } from '@/lib/export-utils'

export type AnnotationMode = 'line' | 'word'

interface Annotation {
  id: string
  text: string
  x: number
  y: number
  width: number
  height: number
  mode: AnnotationMode
}

export default function AnnotationPage() {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [annotationMode, setAnnotationMode] = useState<AnnotationMode>('word')
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [currentBox, setCurrentBox] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/png', 'image/jpeg']
    if (!validTypes.includes(file.type)) {
      alert('Please upload PNG or JPG format only')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setImageUrl(event.target?.result as string)
      setAnnotations([])
    }
    reader.readAsDataURL(file)
  }, [])

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (canvas.width / rect.width)
      const y = (e.clientY - rect.top) * (canvas.height / rect.height)

      setStartPoint({ x, y })
      setIsDrawing(true)
    },
    []
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !startPoint) return

      const canvas = e.currentTarget
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (canvas.width / rect.width)
      const y = (e.clientY - rect.top) * (canvas.height / rect.height)

      const width = x - startPoint.x
      const height = y - startPoint.y

      setCurrentBox({
        x: Math.min(startPoint.x, x),
        y: Math.min(startPoint.y, y),
        width: Math.abs(width),
        height: Math.abs(height),
      })
    },
    [isDrawing, startPoint]
  )

  const handleCanvasMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !startPoint || !currentBox) return

      if (currentBox.width > 10 && currentBox.height > 10) {
        const newAnnotation: Annotation = {
          id: `anno-${Date.now()}`,
          text: '',
          x: Math.round(currentBox.x),
          y: Math.round(currentBox.y),
          width: Math.round(currentBox.width),
          height: Math.round(currentBox.height),
          mode: annotationMode,
        }
        setAnnotations((prev) => [...prev, newAnnotation])
      }

      setIsDrawing(false)
      setCurrentBox(null)
      setStartPoint(null)
    },
    [isDrawing, startPoint, currentBox, annotationMode]
  )

  const handleUpdateAnnotation = useCallback((id: string, text: string) => {
    setAnnotations((prev) =>
      prev.map((anno) => (anno.id === id ? { ...anno, text } : anno))
    )
  }, [])

  const handleDeleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((anno) => anno.id !== id))
  }, [])

  const handleClearAll = useCallback(() => {
    setAnnotations([])
  }, [])

  const handleExportJSON = useCallback(() => {
    const data = exportToJSON(annotations)
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'annotations.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [annotations])

  const handleExportCOCO = useCallback(() => {
    const data = exportToCOCO(annotations, imageUrl)
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'annotations_coco.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [annotations, imageUrl])

  const handleExportPaddleOCR = useCallback(() => {
    const data = exportToPaddleOCR(annotations)
    const text = data.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'annotations_paddleocr.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [annotations])

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="flex items-center justify-center gap-2 text-3xl font-bold text-white">
            <span className="text-sm font-semibold">abc</span>
            <span>Khmer OCR Annotation Tool</span>
          </h1>
          <p className="mt-2 text-indigo-100">
            Annotate text regions for DocTR & PaddleOCR training
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-lg">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Upload className="h-4 w-4" />
            Upload Image
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Annotation Mode:</span>
            <Select value={annotationMode} onValueChange={(value: any) => setAnnotationMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="word">Word Level</SelectItem>
                <SelectItem value="line">Line Level</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleClearAll}
            variant="outline"
            className="gap-2 border-pink-500 text-pink-500 hover:bg-pink-50 bg-transparent"
          >
            <Trash2 className="h-4 w-4" />
            Clear Current Box
          </Button>

          <div className="ml-auto flex gap-2">
            <Button
              onClick={handleExportJSON}
              disabled={annotations.length === 0}
              className="gap-2 bg-green-500 hover:bg-green-600"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <Button
              onClick={handleExportCOCO}
              disabled={annotations.length === 0}
              className="gap-2 bg-cyan-500 hover:bg-cyan-600"
            >
              <Download className="h-4 w-4" />
              Export COCO Format
            </Button>
            <Button
              onClick={handleExportPaddleOCR}
              disabled={annotations.length === 0}
              className="gap-2 bg-cyan-400 hover:bg-cyan-500"
            >
              <Download className="h-4 w-4" />
              Export PaddleOCR Format
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Canvas & Instructions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Instructions */}
            <InstructionsPanel />

            {/* Canvas */}
            {imageUrl && (
              <div className="rounded-lg bg-white p-6 shadow-lg">
                <CanvasAnnotator
                  imageSrc={imageUrl}
                  annotations={annotations}
                  currentBox={currentBox}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                />
              </div>
            )}

            {!imageUrl && (
              <div className="flex items-center justify-center rounded-lg bg-white p-12 text-gray-400 shadow-lg">
                <p>Upload an image to start annotating</p>
              </div>
            )}
          </div>

          {/* Right: Annotations List */}
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <AnnotationsPanel
              annotations={annotations}
              onUpdateText={handleUpdateAnnotation}
              onDelete={handleDeleteAnnotation}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
