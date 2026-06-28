"use client";

import React from "react";

interface ToolbarProps {
  html: string;
  setHtml: (html: string) => void;
  onReset: () => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  editorTheme: string;
  setEditorTheme: React.Dispatch<React.SetStateAction<string>>;
}

export default function Toolbar({
  html,
  setHtml,
  onReset,
  zoom,
  setZoom,
  editorTheme,
  setEditorTheme,
}: ToolbarProps) {
  // Helper to download HTML file
  const downloadHTML = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF using html2canvas + jspdf (lazy loaded)
  const exportPDF = async () => {
    const { default: html2canvas } = await import("html2canvas");
    const { default: JsPDF } = await import("jspdf");
    const iframe = document.getElementById("preview-iframe") as HTMLIFrameElement | null;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    const canvas = await html2canvas(doc.body, { scale: 2 });
    const pdf = new JsPDF({ unit: "pt", format: "a4" });
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    pdf.save("resume.pdf");
  };

  // Simple Zoom controls
  const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));

  // Theme toggle for Monaco editor
  const toggleTheme = () => {
    setEditorTheme((prev) => (prev === "vs-dark" ? "light" : "vs-dark"));
  };

  // Save button – stores current HTML to localStorage immediately
  const saveNow = () => {
    localStorage.setItem("mentorix_resume_html", html);
    alert("Saved to local storage");
  };

  return (
    <div className="flex items-center justify-between p-2 bg-gray-800 text-white space-x-2">
      {/* Left group */}
      <div className="flex items-center space-x-1">
        <button
          className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500"
          onClick={saveNow}
        >
          Save
        </button>
        <button
          className="px-3 py-1 bg-green-600 rounded hover:bg-green-500"
          onClick={downloadHTML}
        >
          Download HTML
        </button>
        <button
          className="px-3 py-1 bg-purple-600 rounded hover:bg-purple-500"
          onClick={exportPDF}
        >
          Export PDF
        </button>
        <button
          className="px-3 py-1 bg-red-600 rounded hover:bg-red-500"
          onClick={onReset}
        >
          Reset
        </button>
      </div>
      {/* Right group */}
      <div className="flex items-center space-x-1">
        <button
          className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
          onClick={zoomOut}
          title="Zoom Out"
        >
          –
        </button>
        <span className="px-2">{Math.round(zoom * 100)}%</span>
        <button
          className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
          onClick={zoomIn}
          title="Zoom In"
        >
          +
        </button>
        <button
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
          onClick={toggleTheme}
        >
          {editorTheme === "vs-dark" ? "Light Theme" : "Dark Theme"}
        </button>
      </div>
    </div>
  );
}
