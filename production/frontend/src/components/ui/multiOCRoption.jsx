import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

const ToggleSwitch = ({ enabled, onToggle }) => (
  <button
    onClick={onToggle}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${
      enabled ? "bg-blue-600" : "bg-gray-200"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
        enabled ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const RadioGroup = ({ options, selected, onChange }) => (
  <div className="flex flex-col gap-2 mt-2">
    {options.map((opt) => (
      <label
        key={opt.value}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 border ${
          selected === opt.value
            ? "border-blue-400 bg-blue-50 text-blue-700"
            : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-700"
        }`}
        onClick={() => onChange(opt.value)}
      >
        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            selected === opt.value ? "border-blue-600" : "border-gray-300"
          }`}
        >
          {selected === opt.value && (
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          )}
        </div>
        <span className="text-sm font-medium">{opt.label}</span>
      </label>
    ))}
  </div>
);

const Section = ({ icon, title, badge, children, accent = "emerald" }) => {
  const borders = {
    emerald: "border-blue-200",
    violet:  "border-teal-200",
  };
  const badgeStyles = {
    emerald: "bg-blue-50 text-blue-600 border-blue-200",
    violet:  "bg-teal-50 text-teal-600 border-teal-200",
  };
  const titleColors = {
    emerald: "text-blue-700",
    violet:  "text-teal-700",
  };

  return (
    <div className={`rounded-xl border ${borders[accent]} bg-white shadow-sm`}>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-base">{icon}</span>
          <h3 className={`text-sm font-bold tracking-wider uppercase font-mono ${titleColors[accent]}`}>
            {title}
          </h3>
        </div>
        {badge && (
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeStyles[accent]}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
};

const SubSetting = ({ label, description, children }) => (
  <div className="rounded-lg bg-gray-50 border border-gray-200 p-3.5">
    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider font-mono">
      {label}
    </p>
    {description && (
      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
    )}
    <div className="mt-2">{children}</div>
  </div>
);

export default function MultiOCRoption({ open, onOpenChange, onApply, settings }) {
  const [detectionEnabled, setDetectionEnabled]     = useState(settings?.detectionEnabled ?? true);
  const [recognitionEnabled, setRecognitionEnabled] = useState(settings?.recognitionEnabled ?? true);
  const [annotationMode, setAnnotationMode]         = useState(settings?.annotationMode ?? "auto");
  const [annotationOption, setAnnotationOption]     = useState(settings?.annotationOption ?? "annotate_extract");
  const [detectionGranularity, setDetectionGranularity] = useState(settings?.detectionGranularity ?? "word");
  const [detectionModel, setDetectionModel]         = useState(settings?.detectionModel ?? "doctr");
  const [recognitionModel, setRecognitionModel]     = useState(settings?.recognitionModel ?? "tesseract");

  const handleApply = () => {
    const config = {
      detectionEnabled,
      recognitionEnabled,
      annotationMode,
      annotationOption,
      detectionGranularity,
      detectionModel,
      recognitionModel,
    };
    onApply && onApply(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={[
          "!top-0 !left-auto !right-0 !bottom-0",
          "!translate-x-0 !translate-y-0",
          "!w-[min(420px,100vw)] !max-w-none !h-screen",
          "flex flex-col p-0",
          "bg-white border-l border-gray-200 rounded-none shadow-2xl",
          "focus:outline-none",
        ].join(" ")}
        style={{
          animation: open
            ? "slideInFromRight 0.3s cubic-bezier(0.4,0,0.2,1) forwards"
            : "slideOutToRight 0.25s cubic-bezier(0.4,0,0.2,1) forwards",
        }}
      >
        {/* Sticky header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <div>
              <p className="text-[10px] text-blue-600/80 tracking-[0.25em] uppercase font-mono font-bold leading-none mb-0.5">
                BigPoint · OCR Engine
              </p>
              <h2 className="text-base font-black text-gray-900 tracking-tight font-mono">
                Pipeline Settings
              </h2>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain bg-gray-50">
          <div className="p-6 space-y-4">

            {/* TEXT DETECTION */}
            <Section title="Option" badge="Module 01" accent="emerald">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Enable module</span>
              </div>

              <div className={`space-y-3 transition-all duration-300 ${
                detectionEnabled ? "opacity-100" : "opacity-30 pointer-events-none"
              }`}>

                {annotationMode === "auto" && (
                  <>
                    <SubSetting label="Annotation Option" description="Output behavior for detected regions">
                      <RadioGroup
                        options={[
                          { value: "Extracted_only",    label: "Extracted_only" },
                          { value: "annotate_only",    label: "Annotation Only" },
                          { value: "annotate_extract", label: "Annotation & Extract" },
                        ]}
                        selected={annotationOption}
                        onChange={setAnnotationOption}
                      />
                    </SubSetting>
                    <SubSetting label="Detection Granularity" description="Level of text region detection">
                      <RadioGroup
                        options={[
                          { value: "word", label: "Word Level" },
                          { value: "line", label: "Line Level" },
                        ]}
                        selected={detectionGranularity}
                        onChange={setDetectionGranularity}
                      />
                    </SubSetting>
                  </>
                )}
              </div>
            </Section>

            {/* TEXT DETECTiON & TEXT RECOGNITION */}
            <Section title="Model" badge="Module 02" accent="violet">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Enable module</span>
              </div>

              <div className={`space-y-3 transition-all duration-300 ${
                recognitionEnabled ? "opacity-100" : "opacity-30 pointer-events-none"
              }`}>
                <SubSetting label="Detection" description="Core detection engine">
                  <RadioGroup
                    options={[
                      { value: "doctr", label: "DocTR" },
                      { value: "yolo",  label: "YOLO" },
                    ]}
                    selected={detectionModel}
                    onChange={setDetectionModel}
                  />
                </SubSetting>

                <SubSetting label="Recognition" description="Core recognition engine">
                  <RadioGroup
                    options={[
                      { value: "tesseract", label: "Tesseract" },
                      { value: "kiriocr",   label: "KiriOCR" },
                    ]}
                    selected={recognitionModel}
                    onChange={setRecognitionModel}
                  />
                </SubSetting>
              </div>
            </Section>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white space-y-3">
          <button
            onClick={handleApply}
            className="w-full py-3 rounded-xl text-white text-sm font-bold tracking-widest uppercase transition-all duration-200 shadow-sm active:scale-[0.98] font-mono"
            style={{
              backgroundColor: "#F88F2D",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#E67D1B"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#F88F2D"}
          >
            Apply Configuration
          </button>

          <div className="flex items-center justify-between text-[10px] text-gray-400 px-1 font-mono">
            <span>Detect: <span className="text-gray-600 uppercase">{detectionModel}</span></span>
            <span>·</span>
            <span>Recog: <span className="text-gray-600 uppercase">{recognitionModel}</span></span>
            <span>·</span>
            <span>Gran: <span className="text-gray-600 uppercase">{detectionGranularity}</span></span>
          </div>
        </div>

        <style>{`
          @keyframes slideInFromRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
          @keyframes slideOutToRight {
            from { transform: translateX(0);    opacity: 1; }
            to   { transform: translateX(100%); opacity: 0; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}