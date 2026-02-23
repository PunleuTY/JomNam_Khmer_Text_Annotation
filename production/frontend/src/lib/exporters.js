import JSZip from "jszip"
import { downloadBlob } from "./download"

export function generateJSON(images, annotations, { includeText = true, projectMeta = {} } = {}) {
  return {
    meta: {
      tool: projectMeta.name || "Khmer Data Annotation Tool",
      lang: projectMeta.lang || "khm",
      timestamp: new Date().toISOString(),
    },
    images: images.map((im) => ({
      id: im.id,
      file_name: im.name,
      width: im.width,
      height: im.height,
    })),
    annotations: Object.fromEntries(
      images.map((im) => {
        const list = annotations[im.id] || []
        return [
          im.id,
          list.map((a) => ({
            id: a.id,
            type: a.type,
            rect: a.rect || null,
            points: a.points || null,
            label: a.label || "",
            text: includeText ? a.text || "" : undefined,
            gt: includeText ? a.gt || "" : undefined,
            accuracy: a.accuracy != null ? a.accuracy : undefined,
          })),
        ]
      })
    ),
  }
}

export function generateCOCO(images, annotations, { includeText = true } = {}) {
  // Simple COCO-style for detection/segmentation with single category "text" id=1
  let annId = 1
  const cocoImages = images.map((im, idx) => ({
    id: idx + 1,
    file_name: im.name,
    width: im.width,
    height: im.height,
  }))
  const imageIdMap = Object.fromEntries(images.map((im, idx) => [im.id, idx + 1]))
  const anns = []
  for (const im of images) {
    const list = annotations[im.id] || []
    for (const a of list) {
      const image_id = imageIdMap[im.id]
      if (a.type === "box") {
        const { x, y, w, h } = a.rect
        anns.push({
          id: annId++,
          image_id,
          category_id: 1,
          bbox: [x, y, w, h],
          area: w * h,
          iscrowd: 0,
          segmentation: [],
          attributes: includeText ? { text: a.text || "", gt: a.gt || "", label: a.label || "" } : {},
        })
      } else if (a.type === "polygon" && Array.isArray(a.points)) {
        const xs = a.points.map((p) => p.x)
        const ys = a.points.map((p) => p.y)
        const minX = Math.min(...xs)
        const minY = Math.min(...ys)
        const maxX = Math.max(...xs)
        const maxY = Math.max(...ys)
        const w = maxX - minX
        const h = maxY - minY
        const segmentation = [a.points.flatMap((p) => [p.x, p.y])]
        anns.push({
          id: annId++,
          image_id,
          category_id: 1,
          bbox: [minX, minY, w, h],
          area: w * h,
          iscrowd: 0,
          segmentation,
          attributes: includeText ? { text: a.text || "", gt: a.gt || "", label: a.label || "" } : {},
        })
      }
    }
  }
  return {
    info: {
      year: new Date().getFullYear(),
      description: "Khmer OCR annotation export",
    },
    licenses: [],
    images: cocoImages,
    annotations: anns,
    categories: [{ id: 1, name: "text", supercategory: "ocr" }],
  }
}

export function generateJSONL(images, annotations, { includeText = true } = {}) {
  // One record per annotation region
  const imageIdMap = Object.fromEntries(images.map((im) => [im.id, im]))
  const lines = []
  for (const im of images) {
    const list = annotations[im.id] || []
    for (const a of list) {
      const rec = {
        image: im.name,
        width: im.width,
        height: im.height,
        type: a.type,
        rect: a.rect || undefined,
        points: a.points || undefined,
      }
      if (includeText) {
        rec.text = a.text || ""
        rec.gt = a.gt || ""
        if (a.accuracy != null) rec.accuracy = a.accuracy
      }
      if (a.label) rec.label = a.label
      lines.push(JSON.stringify(rec))
    }
  }
  return lines.join("\n")
}

export async function generateYOLOZip(images, annotations, { includeText = true } = {}) {
  // YOLO labels: class x_center y_center width height (normalized)
  // We'll use single class "0" for text. Polygons get their bbox.
  const zip = new JSZip()
  const labels = zip.folder("labels")
  const meta = zip.folder("meta")
  const classesTxt = "text\n"
  zip.file("classes.txt", classesTxt)

  for (const im of images) {
    const list = annotations[im.id] || []
    const rows = []
    for (const a of list) {
      let x, y, w, h
      if (a.type === "box") {
        ;({ x, y, w, h } = a.rect)
      } else if (a.type === "polygon") {
        const xs = a.points.map((p) => p.x)
        const ys = a.points.map((p) => p.y)
        const minX = Math.min(...xs)
        const minY = Math.min(...ys)
        const maxX = Math.max(...xs)
        const maxY = Math.max(...ys)
        x = minX
        y = minY
        w = maxX - minX
        h = maxY - minY
      } else continue
      const xc = (x + w / 2) / im.width
      const yc = (y + h / 2) / im.height
      const nw = w / im.width
      const nh = h / im.height
      const attrs = includeText ? ` # label=${a.label || ""}; text=${(a.text || "").replace(/\s+/g, " ").slice(0, 120)}` : ""
      rows.push(`0 ${xc.toFixed(6)} ${yc.toFixed(6)} ${nw.toFixed(6)} ${nh.toFixed(6)}${attrs}`)
    }
    labels.file(fileBase(im.name) + ".txt", rows.join("\n"))
    // Include a simple per-image meta JSON for reference (optional)
    meta.file(fileBase(im.name) + ".json", JSON.stringify({ file_name: im.name, width: im.width, height: im.height }, null, 2))
  }

  const blob = await zip.generateAsync({ type: "blob" })
  downloadBlob("yolo-labels.zip", blob)
}

function fileBase(name) {
  const dot = name.lastIndexOf(".")
  return dot > 0 ? name.slice(0, dot) : name
}