"use client";

import React, { useEffect, useRef } from "react";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onFitPage: () => void;
  onFitWidth: () => void;
  onFitHeight: () => void;
  onZoomTo: (level: number) => void;
  onPrint: () => void;
  onExportPDF: () => void;
  onResetView: () => void;
}

const MENU_ITEMS = [
  { label: "Fit Page", action: "fitPage" as const, shortcut: "Ctrl+0" },
  { label: "Fit Width", action: "fitWidth" as const },
  { label: "Fit Height", action: "fitHeight" as const },
  { type: "separator" as const },
  { label: "100%", action: "zoom" as const, value: 1, shortcut: "Ctrl+1" },
  { label: "125%", action: "zoom" as const, value: 1.25 },
  { label: "150%", action: "zoom" as const, value: 1.5 },
  { label: "200%", action: "zoom" as const, value: 2 },
  { type: "separator" as const },
  { label: "Print", action: "print" as const, shortcut: "Ctrl+P" },
  { label: "Export PDF", action: "exportPdf" as const },
  { type: "separator" as const },
  { label: "Reset View", action: "resetView" as const },
];

export default function PreviewContextMenu({
  x,
  y,
  onClose,
  onFitPage,
  onFitWidth,
  onFitHeight,
  onZoomTo,
  onPrint,
  onExportPDF,
  onResetView,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // Delay to prevent the right-click that opened the menu from closing it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const menuX = Math.min(x, window.innerWidth - 200);
  const menuY = Math.min(y, window.innerHeight - 380);

  const handleAction = (item: (typeof MENU_ITEMS)[number]) => {
    if (item.type === "separator") return;
    switch (item.action) {
      case "fitPage":
        onFitPage();
        break;
      case "fitWidth":
        onFitWidth();
        break;
      case "fitHeight":
        onFitHeight();
        break;
      case "zoom":
        onZoomTo(item.value ?? 1);
        break;
      case "print":
        onPrint();
        break;
      case "exportPdf":
        onExportPDF();
        break;
      case "resetView":
        onResetView();
        break;
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[180px] rounded-lg bg-slate-900 border border-slate-700/60 shadow-2xl shadow-black/40 backdrop-blur-xl overflow-hidden py-1"
      style={{ left: menuX, top: menuY }}
    >
      {MENU_ITEMS.map((item, i) =>
        item.type === "separator" ? (
          <div key={`sep-${i}`} className="h-px bg-slate-700/40 my-1 mx-2" />
        ) : (
          <button
            key={item.label}
            onClick={() => handleAction(item)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left cursor-pointer"
          >
            <span className="font-medium">{item.label}</span>
            {item.shortcut && (
              <span className="text-[10px] text-slate-500 ml-4">{item.shortcut}</span>
            )}
          </button>
        )
      )}
    </div>
  );
}
