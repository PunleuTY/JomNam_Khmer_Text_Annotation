interface Annotation {
  id: string
  text: string
  x: number
  y: number
  width: number
  height: number
  mode: 'line' | 'word'
}

/**
 * Export annotations as JSON format
 * Simple format with all annotation data
 */
export function exportToJSON(annotations: Annotation[]) {
  return {
    version: '1.0',
    format: 'khmer-ocr-annotation',
    exportDate: new Date().toISOString(),
    annotations: annotations.map((anno) => ({
      id: anno.id,
      text: anno.text,
      bbox: {
        x: anno.x,
        y: anno.y,
        width: anno.width,
        height: anno.height,
      },
      mode: anno.mode,
    })),
  }
}

/**
 * Export annotations in COCO (Common Objects in Context) format
 * Used for object detection training datasets
 * API Integration Point: You can modify this function to call your backend API
 */
export function exportToCOCO(annotations: Annotation[], imageUrl: string) {
  // Extract image dimensions from URL or use default
  const imageId = Math.random().toString(36).substr(2, 9)

  return {
    info: {
      description: 'Khmer OCR Annotation Dataset',
      version: '1.0',
      year: new Date().getFullYear(),
      date_created: new Date().toISOString(),
    },
    licenses: [],
    images: [
      {
        id: imageId,
        file_name: 'image.png',
        height: 600, // Default, would be actual image height
        width: 800, // Default, would be actual image width
      },
    ],
    annotations: annotations.map((anno, idx) => ({
      id: idx,
      image_id: imageId,
      category_id: anno.mode === 'line' ? 1 : 2,
      bbox: [anno.x, anno.y, anno.width, anno.height],
      area: anno.width * anno.height,
      iscrowd: 0,
      text: anno.text,
    })),
    categories: [
      {
        id: 1,
        name: 'Line',
        supercategory: 'text',
      },
      {
        id: 2,
        name: 'Word',
        supercategory: 'text',
      },
    ],
  }
}

/**
 * Export annotations in PaddleOCR format
 * Format: image_path\t[{"transcription": "...", "points": [[x,y], [x,y], [x,y], [x,y]]}]
 * API Integration Point: You can modify this to send to your backend
 */
export function exportToPaddleOCR(annotations: Annotation[]): string[] {
  return annotations.map((anno) => {
    // Convert rectangle to 4 corner points for PaddleOCR format
    const points = [
      [anno.x, anno.y],
      [anno.x + anno.width, anno.y],
      [anno.x + anno.width, anno.y + anno.height],
      [anno.x, anno.y + anno.height],
    ]

    const data = {
      transcription: anno.text,
      points: points,
    }

    return `image.png\t${JSON.stringify([data])}`
  })
}

/**
 * API Integration Point: Call your backend ML/detection service
 * Example: Send image to your YOLO or text detection model
 */
export async function callBackendDetection(
  imageUrl: string,
  apiEndpoint: string
): Promise<Array<{ x: number; y: number; width: number; height: number }>> {
  try {
    const formData = new FormData()
    
    // Convert data URL to blob
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    formData.append('image', blob, 'image.png')

    // Call your backend detection API
    const result = await fetch(apiEndpoint, {
      method: 'POST',
      body: formData,
    })

    const detections = await result.json()
    return detections
  } catch (error) {
    console.error('[v0] Backend detection error:', error)
    return []
  }
}

/**
 * API Integration Point: Call your backend OCR service
 * Example: Send cropped image region to your Tesseract or DocTR OCR service
 */
export async function callBackendOCR(
  imageCropUrl: string,
  apiEndpoint: string
): Promise<{ text: string; confidence: number }> {
  try {
    const formData = new FormData()
    
    const response = await fetch(imageCropUrl)
    const blob = await response.blob()
    formData.append('image', blob, 'crop.png')

    const result = await fetch(apiEndpoint, {
      method: 'POST',
      body: formData,
    })

    const data = await result.json()
    return {
      text: data.text || '',
      confidence: data.confidence || 0,
    }
  } catch (error) {
    console.error('[v0] Backend OCR error:', error)
    return { text: '', confidence: 0 }
  }
}
