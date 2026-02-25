import { useEffect } from "react";

export function useShortcuts({
  onBoxMode,
  onPolygonMode,
  onPrevImage,
  onNextImage,
  onGotoVisual,
  onGotoJson,
  onGallery,
  onDeleteLast,
  onUndo,
  onRedo,
  onRunOCR,
  onExportProject, // Ctrl/Cmd+S
}) {
  useEffect(() => {
    const handler = (e) => {
      try {
        const tgt = e.target;
        const tag = tgt?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || tgt?.isContentEditable) return;

        const key = (e.key || "").toLowerCase();

        // --- Single-key actions ---
        switch (key) {
          case "1":
            e.preventDefault();
            onBoxMode?.();
            return;
          case "2":
            e.preventDefault();
            onPolygonMode?.();
            return;
          case "arrowleft":
            e.preventDefault();
            onPrevImage?.();
            return;
          case "arrowright":
            e.preventDefault();
            onNextImage?.();
            return;
          case "g":
            e.preventDefault();
            onGallery?.();
            return;
          case "j":
            e.preventDefault();
            onGotoJson?.();
            return;
          case "v":
            e.preventDefault();
            onGotoVisual?.();
            return;
          case "e":
            e.preventDefault();
            onRunOCR?.();
            return;
          case "delete":
          case "backspace":
            e.preventDefault();
            onDeleteLast?.();
            return;
        }

        // --- Ctrl/Cmd combinations ---
        if (e.ctrlKey || e.metaKey) {
          switch (key) {
            case "s":
              e.preventDefault();
              onExportProject?.();
              return;
            case "z":
            case "x":
              e.preventDefault();
              onUndo?.();
              return;
            case "y":
              e.preventDefault();
              onRedo?.();
              return;
          }
        }
      } catch (err) {
        // silently ignore errors to avoid breaking keyboard shortcuts
      }
    };

    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [
    onBoxMode,
    onPolygonMode,
    onPrevImage,
    onNextImage,
    onGotoVisual,
    onGotoJson,
    onGallery,
    onDeleteLast,
    onUndo,
    onRedo,
    onRunOCR,
    onExportProject,
  ]);
}