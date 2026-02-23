"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Trash2 } from "lucide-react";
// import { cropRegion } from "@/lib/canvas-utils"
// import Tesseract from "tesseract.js"
import { useI18n } from "./translator-provider";
import { Progress } from "@/components/ui/progress";

// // API
// import { sendImagesToBackend } from "../server/sendImageAPI";


export function AnnotationList({
  image,
  annotations,
  onSetGT,
  onDelete,
  onUpdate,
  onBatchStart,
  onBatchStep,
  onBatchEnd,
  runOcr,
}) {
  const { t } = useI18n();
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(null);
  const cancelRef = React.useRef({ cancel: false });

  // const runOcr = async (annId) => {
  //   if (!image) return
  //   try {
  //     const ann = annotations.find((a) => a.id === annId)
  //     const blob = await cropRegion(image.url, ann)
  //     const { data } = await Tesseract.recognize(blob, lang, {
  //       logger: (m) => {
  //         if (m.status && m.progress != null) {
  //           setProgress({ status: m.status, pct: Math.round(m.progress * 100) })
  //         }
  //       },
  //     })
  //     const text = (data?.text || "").trim()
  //     onUpdate(annId, { text })
  //   } catch (e) {
  //     console.error(e)
  //   }
  // }


  // const runOcrAll = async () => {
  //   if (!annotations.length || !image) return;
  //   setBusy(true);
  //   cancelRef.current.cancel = false;

  //   // Send the image and annotations to backend
  //   await sendImagesToBackend({
  //     image: image.url,
  //     annotations: annotations,
  //   });

  //   onBatchStart && onBatchStart(annotations.length);
  //   for (let i = 0; i < annotations.length; i++) {
  //     if (cancelRef.current.cancel) break;
  //     setProgress({
  //       status: t("annotate.processing"),
  //       pct: Math.round((i / annotations.length) * 100),
  //     });
  //     // eslint-disable-next-line no-await-in-loop
  //     //   await runOcr(annotations[i].id)
  //     onBatchStep && onBatchStep(i + 1);
  //   }
  //   setProgress(null);
  //   setBusy(false);
  //   onBatchEnd && onBatchEnd();
  // };

  const cancelBatch = () => {
    cancelRef.current.cancel = true;
  };

  return (
    <Card className={"w-full h-full bg-white shadow-md hover:shadow-lg transition duration-300 border-b-4 border-t-4 border-[#12284c]"}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Annotations</CardTitle>
        <div className="flex items-center gap-2">
          {busy && (
            <>
              <div className="w-40">
                <Progress value={progress?.pct || 0} />
              </div>
              <span className="text-xs text-gray-600">
                {progress?.pct || 0}%
              </span>
              <Button variant="outline" size="sm" onClick={cancelBatch}>
                {t("annotate.cancel")}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={runOcr}
            disabled={!annotations.length || busy}
          >
            <Play className="w-4 h-4 mr-2" />
            {t("Run Ocr")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 overflow-y-auto max-h-[500px]">
        {(!annotations || annotations.length === 0) && (
          <p className="text-sm text-gray-500">{t("None")}</p>
        )}
        {annotations.map((a, idx) => (
          <div key={a.id} className="p-3 rounded-md border">
            <div className="flex items-center justify-between"> 
              <div className="text-sm text-gray-700">
                {a.type === "box" ? t("Box") : t("Polygon")} #
                {idx + 1}
              </div>
              <div className="flex items-center gap-2">
                {typeof a.accuracy === "number" && (
                  <Badge variant="secondary">
                    {t("Accuracy")}: {(a.accuracy * 100).toFixed(1)}%
                  </Badge>
                )}
                {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runOcr(a.id)}
                  disabled={busy}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {t("RunOcr")}
                </Button> */}
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => onDelete(a.id)}
                  aria-label={t("Delete")}
                  className={" bg-red-600 hover:bg-red-700"}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mt-3 grid md:grid-cols-3 gap-3">
              {/* <div>
                <label className="text-xs text-gray-600 block mb-1">
                  {t("Label")}
                </label>
                <Input
                  value={a.label || ""}
                  onChange={(e) => onUpdate(a.id, { label: e.target.value })}
                  placeholder="Text region label"
                />
              </div> */}
              <div className="md:col-span-3">
                <label className="text-xs text-gray-600 block mb-1">
                  {t("Extracted")}
                </label>
                <Textarea
                  value={a.text || ""}
                  onChange={(e) => onUpdate(a.id, { text: e.target.value })}
                  rows={3}
                />

              </div>
            </div>

            <div className="mt-3 grid md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className="text-xs text-gray-600 block mb-1">
                  {t("Ground Truth")}
                </label>
                <Textarea
                  value={a.gt || ""}
                  onChange={(e) => onSetGT(a.id, e.target.value)}
                  rows={3}
                  placeholder="Enter ground truth here"
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

AnnotationList.defaultProps = {
  image: null,
  annotations: [],
  onSetGT: () => {},
  onDelete: () => {},
  onUpdate: () => {},
  lang: "khm",
  onBatchStart: () => {},
  onBatchStep: () => {},
  onBatchEnd: () => {},
};
