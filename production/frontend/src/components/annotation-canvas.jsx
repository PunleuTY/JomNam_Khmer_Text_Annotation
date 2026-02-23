"use client";

import React from "react";
import { cn } from "@/lib/utils";

const COLORS = {
  box: {
    stroke: "rgba(16, 185, 129, 0.9)",
    fill: "rgba(16, 185, 129, 0.15)",
  },
  temp: {
    stroke: "rgba(5, 150, 105, 0.9)",
    dash: [6, 4],
  },
  selected: {
    stroke: "rgba(59, 130, 246, 0.9)",
    fill: "rgba(59, 130, 246, 0.15)",
  },
};

export function AnnotationCanvas({
  image,
  mode,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
}) {
  const containerRef = React.useRef(null);
  const imgRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  const [drawing, setDrawing] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState(null);
  const [selectedId, setSelectedId] = React.useState(null);
  const [temp, setTemp] = React.useState(null);
  const [scale, setScale] = React.useState({ sx: 1, sy: 1 });
  const [mousePos, setMousePos] = React.useState(null);
  const [tempDragPosition, setTempDragPosition] = React.useState(null);

  // --- Zoom State ---
  const [zoom, setZoom] = React.useState(1);

  /** Update scale and canvas size on image resize or zoom change */
  React.useEffect(() => {
    const imgEl = imgRef.current;
    const cvs = canvasRef.current;
    if (!imgEl || !cvs || !image) return;

    const updateScale = () => {
      // Actual rendered size of <img> on screen
      const displayWidth = imgEl.clientWidth * zoom;
      const displayHeight = imgEl.clientHeight * zoom;

      // Resize canvas to match
      cvs.width = displayWidth;
      cvs.height = displayHeight;
      cvs.style.width = `${displayWidth}px`;
      cvs.style.height = `${displayHeight}px`;

      // Map image coordinates -> canvas coordinates
      const newScale = {
        sx: image.width / displayWidth,
        sy: image.height / displayHeight,
      };
      setScale(newScale);
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(imgEl);
    return () => ro.disconnect();
  }, [image?.id, zoom]);

  /** Redraw annotations when data changes */
  React.useEffect(() => {
    drawCanvas();
  }, [annotations, temp, scale, image?.id, mousePos, selectedId, zoom]);

  const drawCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    annotations.forEach((a, i) => {
      const annotationToShow =
        dragging && a.id === selectedId && tempDragPosition
          ? tempDragPosition
          : a;
      drawAnnotation(ctx, annotationToShow, scale, a.id === selectedId, i);
    });

    if (temp) drawTempAnnotation(ctx, temp, mousePos);
  };

  /** Draw saved annotation */
  const drawAnnotation = (ctx, annotation, scale, selected, index) => {
    ctx.save();
    ctx.strokeStyle = selected ? COLORS.selected.stroke : COLORS.box.stroke;
    ctx.fillStyle = selected ? COLORS.selected.fill : COLORS.box.fill;
    ctx.lineWidth = 2;

    if (annotation.type === "box") {
      const { x, y, w, h } = toCanvasRect(annotation.rect, scale);
      ctx.strokeRect(x, y, w, h);
      ctx.fillRect(x, y, w, h);

      // Draw label above the box
      const label = `#${index + 1}`;
      ctx.font = "16px Arial";

      // Measure text width for background
      const textWidth = ctx.measureText(label).width;
      const textHeight = 18; // approximate height

      // Background rectangle - position it above the box, but handle edge cases
      const labelY = y - textHeight > 0 ? y - textHeight : y + h + 2;
      ctx.fillStyle = "red";
      ctx.fillRect(x, labelY, textWidth + 6, textHeight);

      // Text
      ctx.fillStyle = "white";
      ctx.fillText(label, x + 3, labelY + textHeight - 3);
    }

    if (annotation.type === "polygon") {
      ctx.beginPath();
      annotation.points
        .map((p) => toCanvasPoint(p, scale))
        .forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Label at first point of polygon
      const first = toCanvasPoint(annotation.points[0], scale);
      const label = `#${index + 1}`;
      ctx.font = "16px Arial";

      const textWidth = ctx.measureText(label).width;
      const textHeight = 20;

      // Position label to avoid going off-canvas
      const labelY =
        first.y - textHeight > 0 ? first.y - textHeight : first.y + textHeight;

      ctx.fillStyle = "red";
      ctx.fillRect(first.x, labelY, textWidth + 6, textHeight);

      ctx.fillStyle = "white";
      ctx.fillText(
        label,
        first.x + 3,
        labelY +
          (labelY === first.y + textHeight ? textHeight - 3 : textHeight - 3)
      );
    }

    ctx.restore();
  };

  /** Draw temporary annotation while drawing */
  const drawTempAnnotation = (ctx, temp, mousePos) => {
    ctx.save();
    ctx.strokeStyle = COLORS.temp.stroke;
    ctx.setLineDash(COLORS.temp.dash);

    if (temp.type === "box") {
      const { x, y, w, h } = temp;
      ctx.strokeRect(x, y, w, h);
    }

    if (temp.type === "polygon") {
      ctx.beginPath();
      temp.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      if (mousePos) ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();
    }

    ctx.restore();
  };

  /** Clamp helper */
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  /** Improved rectangle clamping with direction preservation */
  function clampRectToImage(rect, image) {
    const x = clamp(rect.x, 0, image.width - Math.max(1, rect.w));
    const y = clamp(rect.y, 0, image.height - Math.max(1, rect.h));
    const w = clamp(rect.w, 1, image.width - x);
    const h = clamp(rect.h, 1, image.height - y);

    return { x, y, w, h };
  }

  /** Improved point clamping */
  function clampPointsToImage(points, image) {
    return points.map((p) => ({
      x: clamp(p.x, 0, image.width),
      y: clamp(p.y, 0, image.height),
    }));
  }

  /** Improved position calculation with bounds checking */
  const getPos = React.useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      x: clamp(x, 0, rect.width),
      y: clamp(y, 0, rect.height),
    };
  }, []);

  /** Find shape under cursor with improved hit detection */
  function findShapeAt(pos) {
    // Check in reverse order so top shapes are selected first
    for (let i = annotations.length - 1; i >= 0; i--) {
      const a = annotations[i];
      if (a.type === "box") {
        const { x, y, w, h } = toCanvasRect(a.rect, scale);
        if (pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h) {
          return a;
        }
      }
      if (a.type === "polygon") {
        const pts = a.points.map((p) => toCanvasPoint(p, scale));
        if (pointInPolygon(pos, pts)) {
          return a;
        }
      }
    }
    return null;
  }

  /** Mouse Down with improved direction handling */
  const onMouseDown = React.useCallback(
    (e) => {
      if (!image) return;
      const pos = getPos(e);

      if (mode === "edit") {
        const hit = findShapeAt(pos);
        if (hit) {
          setSelectedId(hit.id);
          setDragging(true);
          setDragOffset({ startPos: pos, shape: hit });
          setTempDragPosition(hit);
          return;
        } else {
          setSelectedId(null);
        }
      }

      if (mode === "box") {
        setDrawing(true);
        setSelectedId(null);
        setTemp({
          type: "box",
          startX: pos.x,
          startY: pos.y,
          x: pos.x,
          y: pos.y,
          w: 0,
          h: 0,
        });
      }

      if (mode === "polygon") {
        const clamped = {
          x: clamp(pos.x, 0, canvasRef.current?.width || 0),
          y: clamp(pos.y, 0, canvasRef.current?.height || 0),
        };
        if (!temp) {
          setSelectedId(null);
          setTemp({ type: "polygon", points: [clamped] });
        } else {
          setTemp((prev) => ({
            ...prev,
            points: [...prev.points, clamped],
          }));
        }
      }
    },
    [image, mode, getPos, annotations, scale, temp]
  );

  /** Mouse Move with improved direction logic */
  const onMouseMove = React.useCallback(
    (e) => {
      if (!image) return;
      const pos = getPos(e);
      setMousePos(pos);

      if (drawing && temp?.type === "box") {
        setTemp((prev) => {
          const clampedX = clamp(pos.x, 0, canvasRef.current?.width || 0);
          const clampedY = clamp(pos.y, 0, canvasRef.current?.height || 0);

          // Calculate proper direction-aware rectangle
          const left = Math.min(prev.startX, clampedX);
          const top = Math.min(prev.startY, clampedY);
          const right = Math.max(prev.startX, clampedX);
          const bottom = Math.max(prev.startY, clampedY);

          return {
            ...prev,
            x: left,
            y: top,
            w: right - left,
            h: bottom - top,
          };
        });
      }

      if (dragging && selectedId && dragOffset) {
        const dx = (pos.x - dragOffset.startPos.x) * scale.sx;
        const dy = (pos.y - dragOffset.startPos.y) * scale.sy;
        const shape = dragOffset.shape;

        if (shape.type === "box") {
          const movedRect = {
            ...shape.rect,
            x: shape.rect.x + dx,
            y: shape.rect.y + dy,
          };
          const clampedRect = clampRectToImage(movedRect, image);
          setTempDragPosition({
            ...shape,
            rect: clampedRect,
          });
        }

        if (shape.type === "polygon") {
          const movedPoints = shape.points.map((p) => ({
            x: p.x + dx,
            y: p.y + dy,
          }));
          const clampedPoints = clampPointsToImage(movedPoints, image);
          setTempDragPosition({
            ...shape,
            points: clampedPoints,
          });
        }
      }
    },
    [drawing, dragging, temp, selectedId, scale, image, getPos, dragOffset]
  );

  /** Mouse Up with improved validation */
  const onMouseUp = React.useCallback(() => {
    if (temp?.type === "box" && drawing) {
      const norm = toImageRect(temp, scale);

      // Ensure minimum size for valid rectangles
      const minSize = 5; // minimum 5 pixels
      if (norm.w >= minSize && norm.h >= minSize) {
        const clampedRect = clampRectToImage(norm, image);

        onAddAnnotation({
          id: Date.now().toString(),
          type: "box",
          rect: clampedRect,
        });
      }

      setTemp(null);
    }

    if (dragging && selectedId && tempDragPosition) {
      if (tempDragPosition.type === "box") {
        const finalRect = tempDragPosition.rect;

        // Validate rectangle before updating
        if (finalRect.w > 0 && finalRect.h > 0) {
          onUpdateAnnotation(selectedId, { rect: finalRect });
        }
      }

      if (tempDragPosition.type === "polygon") {
        const finalPts = tempDragPosition.points;
        if (finalPts.length >= 3) {
          onUpdateAnnotation(selectedId, { points: finalPts });
        }
      }

      setTempDragPosition(null);
    }

    setDrawing(false);
    setDragging(false);
    setDragOffset(null);
  }, [
    temp,
    drawing,
    scale,
    image,
    onAddAnnotation,
    dragging,
    selectedId,
    tempDragPosition,
    onUpdateAnnotation,
  ]);

  /** Double Click to finish polygon */
  const onDblClick = React.useCallback(() => {
    if (temp && temp.type === "polygon" && temp.points.length >= 3) {
      const normPts = temp.points.map((p) => toImagePoint(p, scale));
      const clampedPts = clampPointsToImage(normPts, image);

      // Validate polygon has sufficient area
      if (clampedPts.length >= 3) {
        onAddAnnotation({
          id: Date.now().toString(),
          type: "polygon",
          points: clampedPts,
        });
      }
      setTemp(null);
    }
  }, [temp, scale, image, onAddAnnotation]);

  /** Keyboard handler for better UX */
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setTemp(null);
        setSelectedId(null);
        setDrawing(false);
        setDragging(false);
      }
      if (e.key === "Delete" && selectedId) {
        // Note: You'd need to add onDeleteAnnotation prop for this to work
        // onDeleteAnnotation(selectedId);
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  // --- Zoom Controls ---
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleZoomReset = () => setZoom(1);

  return (
    <>
      <div className="flex gap-2 mb-2 items-center">
        <button
          type="button"
          onClick={handleZoomOut}
          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          aria-label="Zoom Out"
        >
          −
        </button>
        <span className="text-sm font-medium">{(zoom * 100).toFixed(0)}%</span>
        <button
          type="button"
          onClick={handleZoomIn}
          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          aria-label="Zoom In"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomReset}
          className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 ml-2"
          aria-label="Reset Zoom"
        >
          Reset
        </button>
      </div>
      <div ref={containerRef} className="w-full overflow-auto">
        <div className="flex justify-center items-center min-h-[520px]">
          <div className="relative">
            <img
              ref={imgRef}
              src={image?.url || "/placeholder.svg"}
              alt={image?.name || "image to annotate"}
              className="max-h-[520px] w-auto h-auto object-contain select-none"
              draggable={false}
              style={{
                display: "block",
                scale: zoom,
              }}
            />
            <canvas
              ref={canvasRef}
              className={cn(
                "absolute",
                mode === "box"
                  ? "cursor-crosshair"
                  : mode === "edit"
                  ? "cursor-move"
                  : "cursor-cell"
              )}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onDoubleClick={onDblClick}
              aria-label="Annotation overlay"
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "auto",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

AnnotationCanvas.defaultProps = {
  image: null,
  mode: "box",
  onAddAnnotation: () => {},
  annotations: [],
  onUpdateAnnotation: () => {},
};

/** Improved conversion helpers with better direction handling */
function toCanvasRect(r, scale) {
  return {
    x: r.x / scale.sx,
    y: r.y / scale.sy,
    w: r.w / scale.sx,
    h: r.h / scale.sy,
  };
}

function toImageRect(r, scale) {
  // Handle negative dimensions properly
  const x = r.x;
  const y = r.y;
  const w = Math.abs(r.w);
  const h = Math.abs(r.h);

  return {
    x: Math.round(x * scale.sx),
    y: Math.round(y * scale.sy),
    w: Math.round(w * scale.sx),
    h: Math.round(h * scale.sy),
  };
}

function toCanvasPoint(p, scale) {
  return { x: p.x / scale.sx, y: p.y / scale.sy };
}

function toImagePoint(p, scale) {
  return { x: Math.round(p.x * scale.sx), y: Math.round(p.y * scale.sy) };
}

/** Improved point-in-polygon algorithm with edge case handling */
function pointInPolygon(point, vs) {
  if (vs.length < 3) return false;

  let x = point.x,
    y = point.y;
  let inside = false;

  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x,
      yi = vs[i].y;
    const xj = vs[j].x,
      yj = vs[j].y;

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
