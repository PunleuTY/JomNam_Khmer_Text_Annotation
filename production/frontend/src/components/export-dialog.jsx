"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  generateCOCO,
  generateJSON,
  generateJSONL,
  generateYOLOZip,
} from "@/lib/exporters";
import { downloadJson } from "@/lib/download";
import { useI18n } from "./translator-provider";

export function ExportDialog({
  open,
  onOpenChange,
  images,
  annotations,
  projectMeta,
}) {
  const { t } = useI18n();
  const [format, setFormat] = React.useState("json");
  const [includeText, setIncludeText] = React.useState(true);

  const onExport = async () => {
    if (format === "json") {
      const data = generateJSON(images, annotations, {
        includeText,
        projectMeta,
      });
      downloadJson("annotations.json", data);
    } else if (format === "coco") {
      const data = generateCOCO(images, annotations, { includeText });
      downloadJson("coco.json", data);
    } else if (format === "jsonl") {
      const content = generateJSONL(images, annotations, { includeText });
      const blob = new Blob([content], { type: "application/x-ndjson" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dataset.jsonl";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } else if (format === "yolo") {
      await generateYOLOZip(images, annotations, { includeText });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-xl shadow-md hover:shadow-lg transition duration-300 border-b-4 border-t-4 border-[#12284c]">
        <DialogHeader>
          <DialogTitle>{t("Title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-gray-600">{t("Format")}</Label>
            <RadioGroup
              value={format}
              onValueChange={setFormat}
              className="mt-2 grid grid-cols-2 gap-2"
            >
              <label className="flex items-center gap-2 border rounded-md p-2">
                <RadioGroupItem
                  value="json"
                  className="text-[#12284c] data-[state=checked]:bg-[#12284c] data-[state=checked]:border-[#12284c]"
                />{" "}
                JSON
              </label>
              {/* <label className="flex items-center gap-2 border rounded-md p-2">
      <RadioGroupItem
        value="coco"
        className="text-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
      />{" "}
      COCO
    </label>
    <label className="flex items-center gap-2 border rounded-md p-2">
      <RadioGroupItem
        value="jsonl"
        className="text-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
      />{" "}
      JSONL
    </label> */}
              <label className="flex items-center gap-2 border rounded-md p-2">
                <RadioGroupItem
                  value="yolo"
                  className="text-[#12284c] data-[state=checked]:bg-[#12284c] data-[state=checked]:border-[#12284c]"
                />{" "}
                YOLO
              </label>
            </RadioGroup>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="includeText"
              checked={includeText}
              onCheckedChange={(v) => setIncludeText(!!v)}
            />
            <label htmlFor="includeText" className="text-sm">
              {t("Include Text")}
            </label>
          </div>
          <div className="flex justify-end ">
            <Button onClick={onExport} className={"bg-[#F88F2D] text-white hover:bg-[#ffa754]"}>{t("Download")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

ExportDialog.defaultProps = {
  open: false,
  onOpenChange: () => {},
  images: [],
  annotations: {},
  projectMeta: {},
};
