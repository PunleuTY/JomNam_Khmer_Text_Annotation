"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScanText } from 'lucide-react'
// import Tesseract from "tesseract.js"
import { useI18n } from "./translator-provider"

export function OcrControls({ lang, setLang, image, onOcrResult }) {
const { t } = useI18n()
//   const [busy, setBusy] = React.useState(false)
//   const [progress, setProgress] = React.useState(null)

//   const onOcrEntire = async () => {
//     if (!image) return
//     setBusy(true)
//     setProgress({ status: t("annotate.queued"), pct: 0 })
//     try {
//       const { data } = await Tesseract.recognize(image.url, lang, {
//         logger: (m) => {
//           if (m.status && m.progress != null) {
//             setProgress({ status: m.status, pct: Math.round(m.progress * 100) })
//           }
//         },
//       })
//       const text = (data?.text || "").trim()
//       const conf = data?.confidence != null ? data.confidence : null
//       onOcrResult && onOcrResult({ text, conf })
//     } catch (e) {
//       console.error(e)
//     } finally {
//       setBusy(false)
//       setProgress(null)
//     }
//   }

  return (
    <div className="space-y-3">
      <div>
        <Select value={lang} onValueChange={setLang}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select OCR language" />
          </SelectTrigger>
          <SelectContent className={"bg-white"}>
            <SelectItem value="khm" className={"hover:bg-[#ff3e34dc]"}>khm (Khmer)</SelectItem>
            <SelectItem value="eng" className={"hover:bg-[#ff3e34dc]"}>eng (English)</SelectItem>

          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

OcrControls.defaultProps = {
  lang: "khm",
  setLang: () => {},
  image: null,
  onOcrResult: () => {},
}