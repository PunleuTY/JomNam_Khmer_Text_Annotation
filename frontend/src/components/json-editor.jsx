"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  FileJson,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Play,
} from "lucide-react";
import { useI18n } from "./translator-provider";
import { levenshteinSimilarity } from "/src/lib/levenshtein.js";

export function JsonEditor({
  images,
  annotations,
  currentId,
  onUpdate,
  runOcr,
  onSave,
}) {
  const { t } = useI18n();
  const [viewMode, setViewMode] = React.useState("current"); // "current" | "all"
  const [jsonText, setJsonText] = React.useState("");
  const [error, setError] = React.useState(null);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [busy, setBusy] = React.useState(true);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    if (Object.keys(annotations).length === 0) {
      setBusy(true);
    } else {
      setBusy(false);
    }
  }, [annotations]);

  // Update JSON text when data changes
  React.useEffect(() => {
    try {
      let data;
      if (viewMode === "current" && currentId) {
        const currentImage = images.find((img) => img.id === currentId);
        const currentAnnotations = annotations[currentId] || [];
        data = {
          image: currentImage
            ? {
                id: currentImage.id,
                name: currentImage.name,
                width: currentImage.width,
                height: currentImage.height,
              }
            : null,
          annotations: currentAnnotations,
        };
      } else {
        data = {
          images: images.map((img) => ({
            id: img.id,
            name: img.name,
            width: img.width,
            height: img.height,
          })),
          annotations,
        };
      }
      const formatted = JSON.stringify(data, null, 2);
      setJsonText(formatted);
      setHasChanges(false);
      setError(null);
    } catch (e) {
      setError(t("json.formatError"));
    }
  }, [images, annotations, currentId, viewMode, t]);

  const handleTextChange = (value) => {
    setJsonText(value);
    setHasChanges(true);
    setError(null);
  };

  const validateAndApply = () => {
    try {
      const parsed = JSON.parse(jsonText);

      if (viewMode === "current" && currentId) {
        // Update current image annotations
        if (parsed.annotations && Array.isArray(parsed.annotations)) {
          // Validate annotation structure
          for (const ann of parsed.annotations) {
            if (!ann.id || !ann.type) {
              throw new Error(t("json.invalidAnnotation"));
            }
            if (ann.type === "box" && !ann.rect) {
              throw new Error(t("json.missingRect"));
            }
            if (ann.type === "polygon" && !ann.points) {
              throw new Error(t("json.missingPoints"));
            }
          }

          // Recalculate accuracy for annotations with both text and gt
          const processedAnnotations = parsed.annotations.map((ann) => {
            if (ann.text && ann.gt) {
              return {
                ...ann,
                accuracy: levenshteinSimilarity(ann.text, ann.gt),
              };
            }
            return ann;
          });

          onUpdate({
            ...annotations,
            [currentId]: processedAnnotations,
          });
        }
      } else {
        // Update all annotations
        if (parsed.annotations && typeof parsed.annotations === "object") {
          // Validate all annotations
          for (const [imageId, anns] of Object.entries(parsed.annotations)) {
            if (!Array.isArray(anns)) continue;
            for (const ann of anns) {
              if (!ann.id || !ann.type) {
                throw new Error(t("json.invalidAnnotation"));
              }
            }
          }

          // Process all annotations
          const processedAnnotations = {};
          for (const [imageId, anns] of Object.entries(parsed.annotations)) {
            if (!Array.isArray(anns)) continue;
            processedAnnotations[imageId] = anns.map((ann) => {
              if (ann.text && ann.gt) {
                return {
                  ...ann,
                  accuracy: levenshteinSimilarity(ann.text, ann.gt),
                };
              }
              return ann;
            });
          }

          onUpdate(processedAnnotations);
        }
      }

      setHasChanges(false);
      setError(null);
      
      // Call the save function to persist to database
      if (onSave) {
        onSave();
      }
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      
    } catch (e) {
      setError(e.message || t("json.parseError"));
    }
  };

  const resetChanges = () => {
    // Trigger re-render of original data
    setViewMode(viewMode === "current" ? "all" : "current");
    setTimeout(() => setViewMode(viewMode), 0);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      // Show success feedback
      const originalText = document.activeElement?.textContent;
      if (document.activeElement) {
        const btn = document.activeElement;
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Copied!';
        setTimeout(() => {
          btn.innerHTML = originalHTML;
        }, 2000);
      }
    } catch (e) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = jsonText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  const currentImage = images.find((img) => img.id === currentId);
  const currentAnnotations = annotations[currentId] || [];

  return (
    <Card>
      {/* <CardHeader className="pb-3">
      </CardHeader> */}
      <CardContent className="space-y-4">
        <CardTitle className="text-base flex items-center gap-2 mb-5">
          <FileJson className="w-4 h-4 text-emerald-600" />
          Json Editor
        </CardTitle>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-40 mt-1 ">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="current">
                    {t("Current Image")}{" "}
                    {currentImage ? `(${currentImage.name})` : ""}
                  </SelectItem>
                  <SelectItem value="all">{t("All Images")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {viewMode === "current" && (
              <div className="text-sm text-gray-600">
                {currentAnnotations.length} {t("Annotations")}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge
                  variant="secondary"
                  className="text-orange-700 bg-orange-100"
                >
                  {t("Unsaved Changes")}
                </Badge>
              )}
              {saveSuccess && (
                <Badge
                  variant="secondary"
                  className="text-green-700 bg-green-100"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Saved!
                </Badge>
              )}
              {!error && !hasChanges && !saveSuccess && (
                <Badge
                  variant="secondary"
                  className="text-green-700 bg-green-100"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {t("Valid")}
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runOcr}
              disabled={busy}
            >
              <Play className="w-4 h-4 mr-2" />
              {t("Run Ocr")}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                copyToClipboard();
              }}
              type="button"
            >
              <Copy className="w-4 h-4 mr-2" />
              {t("Copy") || "Copy"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetChanges}
              disabled={!hasChanges}
              type="button"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t("Reset") || "Reset"}
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                validateAndApply();
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
              type="button"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="relative overflow-y-auto h-[500px]">
          <Textarea
            value={jsonText}
            onChange={(e) => handleTextChange(e.target.value)}
            className="font-mono text-sm min-h-[400px] resize-y"
            placeholder={t("Placeholder")}
          />
          <div className="absolute top-2 right-2 text-xs text-gray-400">
            {jsonText.split("\n").length} {t("Lines")}
          </div>
        </div>

        {/* <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>{t("json.tips")}:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{t("json.tip1")}</li>
            <li>{t("json.tip2")}</li>
            <li>{t("json.tip3")}</li>
            <li>{t("json.tip4")}</li>
          </ul>
        </div> */}
      </CardContent>
    </Card>
  );
}

JsonEditor.defaultProps = {
  images: [],
  annotations: {},
  currentId: null,
  onUpdate: () => {},
  onSave: null,
};
