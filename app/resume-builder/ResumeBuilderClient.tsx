import React, { useState, useEffect, useCallback, useRef } from "react";
import TopNavbar from "@/components/resume-builder/TopNavbar";
import MonacoEditor from "@monaco-editor/react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

const DEFAULT_TEMPLATE_URL = "/templates/default_resume.html";
const LOCAL_STORAGE_KEY = "mentorix_resume_html";
const LAYOUT_STORAGE_KEY = "mentorix_resume_layout_size";

function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function ResumeBuilderClient() {
  const [html, setHtml] = useState<string>("");
  const [zoom, setZoom] = useState<number | string>("page");
  const [editorTheme, setEditorTheme] = useState<string>("vs-dark");
  const [scale, setScale] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("default");
  
  // Editor status info
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [pageCount, setPageCount] = useState(1);
  const [minimapEnabled, setMinimapEnabled] = useState(true);
  const [wordWrapEnabled, setWordWrapEnabled] = useState("on");
  
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  // Load saved or default template
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      setHtml(saved);
    } else {
      fetch(DEFAULT_TEMPLATE_URL)
        .then(r => r.text())
        .then(t => setHtml(t))
        .catch(() => setHtml("<div>No template found</div>"));
    }
  }, []);

  // Autosave (debounced)
  const saveToLocal = useCallback(
    debounce((content: string) => {
      localStorage.setItem(LOCAL_STORAGE_KEY, content);
      setSaveStatus("saved");
    }, 1000),
    []
  );

  const triggerSave = useCallback(() => {
    setSaveStatus("saving");
    localStorage.setItem(LOCAL_STORAGE_KEY, html);
    setTimeout(() => {
      setSaveStatus("saved");
    }, 400);
  }, [html]);

  const handleDownloadHTML = useCallback(() => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.html";
    a.click();
    URL.revokeObjectURL(url);
  }, [html]);

  const handleExportPDF = useCallback(async () => {
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
  }, []);

  const handlePrint = useCallback(() => {
    const iframe = document.getElementById("preview-iframe") as HTMLIFrameElement | null;
    if (!iframe) return;
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  }, []);

  // Load template files when selectedTemplate changes
  useEffect(() => {
    if (selectedTemplate !== "default") {
      // Just simulate loading different templates or reset
      fetch(`/templates/${selectedTemplate}_resume.html`)
        .then(r => {
          if (!r.ok) throw new Error();
          return r.text();
        })
        .then(t => {
          setHtml(t);
          setSaveStatus("unsaved");
        })
        .catch(() => {
          // Fallback or keep current html if template file is missing
        });
    }
  }, [selectedTemplate]);

  // Compute number of pages dynamically from iframe content height
  useEffect(() => {
    const iframe = document.getElementById("preview-iframe") as HTMLIFrameElement | null;
    if (!iframe) return;

    const checkHeight = () => {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc || !doc.body) return;
      const scrollHeight = doc.body.scrollHeight;
      // standard A4 height is approx 1123px. Let's calculate the page count based on this
      const computedPages = Math.max(1, Math.ceil(scrollHeight / 1120));
      setPageCount(computedPages);
    };

    const interval = setInterval(checkHeight, 1000);
    return () => clearInterval(interval);
  }, [html]);

  // Handle format shortcut or helper
  const handleFormat = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run();
    }
  }, []);

  // Set keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        triggerSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handleExportPDF();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        handleFormat();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerSave, handleExportPDF, handleFormat]);

  // Handle Ctrl+MouseWheel zooming inside preview panel container
  const handleWheelZoom = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (typeof zoom === "number") {
        const factor = e.deltaY < 0 ? 0.05 : -0.05;
        setZoom(prev => Math.min(Math.max(Number(prev) + factor, 0.4), 2.5));
      } else {
        setZoom(1.0);
      }
    }
  }, [zoom]);

  // Autosave triggers
  useEffect(() => {
    if (html) {
      setSaveStatus("unsaved");
      saveToLocal(html);
    }
  }, [html, saveToLocal]);

  // Scaling logic to fit A4 inside the available container size
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    
    const pageWidth = 794; // 210mm at 96 DPI
    const pageHeight = 1123; // 297mm at 96 DPI
    
    const parent = containerRef.current.parentElement;
    if (!parent) return;
    
    const containerWidth = parent.clientWidth;
    const containerHeight = parent.clientHeight;
    
    const padding = 40; // 20px padding on each side
    const availableWidth = Math.max(containerWidth - padding, 100);
    const availableHeight = Math.max(containerHeight - padding, 100);
    
    const widthScale = availableWidth / pageWidth;
    const heightScale = availableHeight / pageHeight;
    const maxFitScale = Math.min(widthScale, heightScale, 1.0);
    
    if (zoom === "width") {
      setScale(widthScale);
    } else if (zoom === "height") {
      setScale(heightScale);
    } else if (zoom === "page") {
      setScale(maxFitScale);
    } else if (typeof zoom === "number") {
      // Allow vertical scroll if zoom goes taller than heightScale, but cap strictly to widthScale to prevent horizontal scrolling
      setScale(Math.min(zoom, widthScale));
    }
  }, [zoom]);

  // Update scale when wrapper resizes or zoom changes
  useEffect(() => {
    if (!containerRef.current) return;
    const parent = containerRef.current.parentElement;
    if (!parent) return;
    
    const observer = new ResizeObserver(() => {
      updateScale();
    });
    
    observer.observe(parent);
    updateScale(); // Initial call
    
    return () => {
      observer.disconnect();
    };
  }, [updateScale]);

  const handleEditorChange = (value?: string) => {
    if (value !== undefined) setHtml(value);
  };

  const resetTemplate = () => {
    fetch(DEFAULT_TEMPLATE_URL)
      .then(r => r.text())
      .then(t => {
        setHtml(t);
        setSaveStatus("unsaved");
      })
      .catch(() => setHtml("<div>No template found</div>"));
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPos({
        line: e.position.lineNumber,
        column: e.position.column
      });
    });
  };

  // Keep divider resizing sizes persisted in localStorage
  const [panelSize, setPanelSize] = useState<number>(55);
  useEffect(() => {
    const savedSize = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (savedSize) {
      setPanelSize(parseFloat(savedSize));
    }
  }, []);

  const handleLayoutResize = (sizes: number[]) => {
    if (sizes && sizes.length > 0) {
      localStorage.setItem(LAYOUT_STORAGE_KEY, sizes[0].toString());
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <TopNavbar
        html={html}
        setHtml={setHtml}
        onReset={resetTemplate}
        zoom={zoom}
        setZoom={setZoom}
        editorTheme={editorTheme}
        setEditorTheme={setEditorTheme}
        saveStatus={saveStatus}
        onSave={triggerSave}
        onExportPDF={handleExportPDF}
        onDownloadHTML={handleDownloadHTML}
        onPrint={handlePrint}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
      />
      
      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        <PanelGroup direction="horizontal" className="flex-1" onLayout={handleLayoutResize}>
          {/* Monaco Editor Panel */}
          <Panel defaultSize={panelSize} minSize={30} maxSize={70} className="bg-slate-900 flex flex-col h-full overflow-hidden">
            <div className="flex-1 min-h-0 relative">
              <MonacoEditor
                height="100%"
                defaultLanguage="html"
                theme={editorTheme}
                value={html}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: minimapEnabled },
                  lineNumbers: "on",
                  automaticLayout: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  wordWrap: wordWrapEnabled as any,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  scrollbar: {
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10,
                  }
                }}
              />
            </div>
          </Panel>
          
          {/* Resize Handle */}
          <PanelResizeHandle className="w-1.5 bg-slate-800 hover:bg-indigo-600 active:bg-indigo-500 cursor-col-resize transition-all duration-150 z-10 flex items-center justify-center">
            <div className="w-[2px] h-6 bg-slate-600 rounded-full" />
          </PanelResizeHandle>
          
          {/* Live Preview Panel */}
          <Panel defaultSize={100 - panelSize} minSize={30} maxSize={70} className="bg-[#ececec] overflow-y-auto overflow-x-hidden relative flex justify-center items-start h-full">
            <div 
              ref={containerRef} 
              onWheel={handleWheelZoom}
              className="w-full flex flex-col items-center py-10 px-6 select-none"
              style={{
                minHeight: "100%",
                height: `${1123 * scale + 120}px`, 
              }}
            >
              <div
                style={{
                  width: "794px",
                  height: "1123px",
                  transform: `scale(${scale})`,
                  transformOrigin: "top center",
                  transition: "transform 0.1s ease-out",
                }}
                className="bg-white shadow-2xl rounded-md overflow-hidden flex-shrink-0 border border-black/5"
              >
                <iframe
                  id="preview-iframe"
                  title="Resume Preview"
                  srcDoc={html}
                  className="w-full h-full border-none bg-white"
                />
              </div>

              {/* Dynamic Page Indicators */}
              <div className="mt-6 flex items-center space-x-2 bg-slate-900/90 text-slate-300 px-3 py-1.5 rounded-full text-xs shadow-lg backdrop-blur-md border border-slate-700/50">
                <span className="font-medium text-slate-200">Page 1 of {pageCount}</span>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Code Editor Status Bar */}
      <footer className="h-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4 text-xs text-slate-400 select-none shrink-0 font-medium z-40">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span>HTML Mode</span>
          </span>
          <span className="text-slate-600">|</span>
          <span>Template: {selectedTemplate === "default" ? "ATS Classic" : selectedTemplate}</span>
          <span className="text-slate-600">|</span>
          <span className="cursor-pointer hover:text-slate-200" onClick={() => setWordWrapEnabled(w => w === "on" ? "off" : "on")}>
            Wrap: {wordWrapEnabled.toUpperCase()}
          </span>
          <span className="text-slate-600">|</span>
          <span className="cursor-pointer hover:text-slate-200" onClick={() => setMinimapEnabled(m => !m)}>
            Minimap: {minimapEnabled ? "ON" : "OFF"}
          </span>
        </div>
        <div className="flex items-center space-x-4 font-mono text-[11px]">
          <span>UTF-8</span>
          <span className="text-slate-600">|</span>
          <span>Ln {cursorPos.line}, Col {cursorPos.column}</span>
          <span className="text-slate-600">|</span>
          <span>Size: {(html.length / 1024).toFixed(1)} KB</span>
        </div>
      </footer>
    </div>
  );
}
