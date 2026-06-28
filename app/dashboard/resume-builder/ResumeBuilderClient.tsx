import React, { useState, useEffect, useCallback } from "react";
import TopNavbar from "@/components/resume-builder/TopNavbar";
import MonacoEditor from "@monaco-editor/react";




const DEFAULT_TEMPLATE_URL = "/templates/default_resume.html";
const LOCAL_STORAGE_KEY = "mentorix_resume_html";

function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function ResumeBuilderClient() {
  const [html, setHtml] = useState<string>("");
  const [zoom, setZoom] = useState<number>(1);
  const [editorTheme, setEditorTheme] = useState<string>("vs-dark");

  // Load saved or default template
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      setHtml(saved);
    } else {
      fetch(DEFAULT_TEMPLATE_URL)
        .then((r) => r.text())
        .then((t) => setHtml(t))
        .catch(() => setHtml("<div>No template found</div>"));
    }
  }, []);

  // Autosave (debounced)
  const saveToLocal = useCallback(
    debounce((content: string) => {
      localStorage.setItem(LOCAL_STORAGE_KEY, content);
    }, 1000),
    []
  );

  useEffect(() => {
    if (html) saveToLocal(html);
  }, [html, saveToLocal]);

  const handleEditorChange = (value?: string) => {
    if (value !== undefined) setHtml(value);
  };

  const resetTemplate = () => {
    fetch(DEFAULT_TEMPLATE_URL)
      .then((r) => r.text())
      .then((t) => setHtml(t))
      .catch(() => setHtml("<div>No template found</div>"));
  };

  const [selectedTemplate, setSelectedTemplate] = useState<string>("default");

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      <TopNavbar
        html={html}
        setHtml={setHtml}
        onReset={resetTemplate}
        zoom={zoom}
        setZoom={(val) => typeof val === "number" ? setZoom(val) : setZoom(1)}
        editorTheme={editorTheme}
        setEditorTheme={setEditorTheme}
        saveStatus="saved"
        onSave={() => {}}
        onExportPDF={() => {}}
        onDownloadHTML={() => {}}
        onPrint={() => {}}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2">
          <MonacoEditor
            height="100%"
            defaultLanguage="html"
            theme={editorTheme}
            value={html}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: true },
              lineNumbers: "on",
              automaticLayout: true,
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </div>
        <div className="w-1/2 flex items-center justify-center bg-gray-200 overflow-auto relative">
          <iframe
            title="Resume Preview"
            srcDoc={html}
            className="bg-white shadow-lg absolute inset-0"
            style={{
              width: `${210 * zoom}mm`,
              height: `${297 * zoom}mm`,
              border: "none",
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
          />
        </div>
      </div>
    </div>
  );
}
