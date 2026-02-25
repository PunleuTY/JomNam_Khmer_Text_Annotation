import { OcrTool } from "@/components/OcrTool-recognition";

export const metadata = {
  title: "Khmer OCR — Recognition",
  description:
    "Upload images and extract Khmer text with OCR recognition models",
};

export default function RecognitionPage() {
  return <OcrTool />;
}
