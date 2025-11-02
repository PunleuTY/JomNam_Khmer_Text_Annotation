import React from "react";

const KeyboardShortcuts = () => {
  const renderKey = (key) => (
    <span className="px-2 py-1 bg-white border rounded-md shadow-sm font-semibold text-gray-800 text-sm">
      {key}
    </span>
  );

  const renderKeyCombo = (combo) => (
    <span className="flex items-center gap-1">
      {combo.map((k, i) => (
        <React.Fragment key={i}>{renderKey(k)}</React.Fragment>
      ))}
    </span>
  );

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl shadow p-6 max-w-md">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>⌨️</span> Keyboard Shortcuts
      </h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-600 mb-1">ANNOTATION</h3>
          <div className="flex justify-between"><span>Box</span>{renderKey("1")}</div>
          <div className="flex justify-between"><span>Polygon</span>{renderKey("2")}</div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-600 mb-1">NAVIGATION</h3>
          <div className="flex justify-between"><span>Gallery</span>{renderKey("G")}</div>
          <div className="flex justify-between"><span>Prev/Next</span><span className="flex gap-1">{[renderKey("←"), renderKey("→")]}</span></div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-600 mb-1">EDIT</h3>
          <div className="flex justify-between"><span>Undo</span>{renderKeyCombo(["Ctrl", "X"])}</div>
          <div className="flex justify-between"><span>Redo</span>{renderKeyCombo(["Ctrl", "Y"])}</div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-600 mb-1">ACTIONS</h3>
          <div className="flex justify-between"><span>Run OCR</span>{renderKey("E")}</div>
          <div className="flex justify-between"><span>JSON View</span>{renderKey("J")}</div>
          <div className="flex justify-between"><span>Export</span>{renderKeyCombo(["Ctrl", "S"])}</div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
