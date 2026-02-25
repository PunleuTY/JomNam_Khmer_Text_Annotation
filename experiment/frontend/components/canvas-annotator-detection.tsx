'use client'

import React, { useEffect, useRef } from 'react'

interface Annotation {
  id: string
  text: string
  x: number
  y: number
  width: number
  height: number
  mode: 'line' | 'word'
}

interface Props {
  imageSrc: string
  annotations: Annotation[]
  currentBox: { x: number; y: number; width: number; height: number } | null
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void
}

export function CanvasAnnotator({
  imageSrc,
  annotations,
  currentBox,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Draw existing annotations
      annotations.forEach((anno) => {
        ctx.strokeStyle = '#FFEB3B'
        ctx.lineWidth = 2
        ctx.strokeRect(anno.x, anno.y, anno.width, anno.height)

        // Draw label background
        if (anno.text) {
          const fontSize = 14
          ctx.font = `${fontSize}px Arial`
          const textMetrics = ctx.measureText(anno.text)
          const textWidth = textMetrics.width

          ctx.fillStyle = '#FFEB3B'
          ctx.fillRect(anno.x, anno.y - fontSize - 5, textWidth + 10, fontSize + 5)

          ctx.fillStyle = '#000'
          ctx.fillText(anno.text, anno.x + 5, anno.y - 5)
        }
      })

      // Draw current box being drawn
      if (currentBox) {
        ctx.strokeStyle = '#FF9800'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.strokeRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height)
        ctx.setLineDash([])
      }
    }
    img.src = imageSrc
  }, [imageSrc, annotations, currentBox])

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      className="w-full border border-gray-300 cursor-crosshair rounded"
    />
  )
}
