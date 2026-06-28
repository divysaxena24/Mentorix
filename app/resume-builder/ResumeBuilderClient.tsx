import React, { useState, useEffect, useCallback, useRef } from "react";
import TopNavbar from "@/components/resume-builder/TopNavbar";
import MonacoEditor from "@monaco-editor/react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import PreviewContextMenu from "./PreviewContextMenu";

const DEFAULT_TEMPLATE_URL = "/templates/default_resume.html";
const LOCAL_STORAGE_KEY = "mentorix_resume_html";
const LAYOUT_STORAGE_KEY = "mentorix_resume_layout_size";

const A4_WIDTH = 794;   // 210mm at 96 DPI
const A4_HEIGHT = 1123; // 297mm at 96 DPI
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.1;
const PAN_THRESHOLD = 5; // px before a drag starts panning
const SCROLL_SPEED = 1.5;
const MINI_NAV_HIDE_DELAY = 2500; // ms
const CLICK_FORWARD_HIDE_DELAY = 150; // ms

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

  // Editor status
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [pageCount, setPageCount] = useState(1);
  const [minimapEnabled, setMinimapEnabled] = useState(true);
  const [wordWrapEnabled, setWordWrapEnabled] = useState("on");

  // ── Interactive Preview State ──────────────────────────────────────────
  const [fitMode, setFitMode] = useState<"page" | "width" | "height" | null>("page");
  const [manualZoom, setManualZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [showMiniNav, setShowMiniNav] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isHovering, setIsHovering] = useState(false);
  const [isIframeActive, setIsIframeActive] = useState(false);

  // ── Refs for Performant DOM Interaction ──────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const miniNavTimer = useRef<ReturnType<typeof setTimeout>>();
  const hideOverlayTimer = useRef<ReturnType<typeof setTimeout>>();
  const draggingRef = useRef(false); // true when user is mid-text-selection in iframe

  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    wasPanning: false,
  });
  const panRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const touchRef = useRef({
    initialDist: 0,
    initialScale: 1,
    initialPanX: 0,
    initialPanY: 0,
    initialMidX: 0,
    initialMidY: 0,
    isPinching: false,
  });

  // Sync refs when state changes
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  // Load saved/default template
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

  // Autosave
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
    setTimeout(() => setSaveStatus("saved"), 400);
  }, [html]);

  useEffect(() => {
    if (html) {
      setSaveStatus("unsaved");
      saveToLocal(html);
    }
  }, [html, saveToLocal]);

  // ── Unified zoom/fitMode interface for TopNavbar ──────────────────────
  const handleSetZoom = useCallback((val: number | string) => {
    if (typeof val === "string") {
      setFitMode(val as "page" | "width" | "height");
      setZoom(val);
    } else {
      setFitMode(null);
      setManualZoom(val);
      setZoom(val);
    }
  }, []);

  // ── Transform Application ─────────────────────────────────────────────
  const computeAndApplyTransform = useCallback((smooth = false) => {
    if (!transformRef.current || !viewportRef.current) return;

    const vw = viewportRef.current.clientWidth;
    const vh = viewportRef.current.clientHeight;
    const s = scaleRef.current;
    const p = panRef.current;
    const docW = A4_WIDTH * s;
    const docH = A4_HEIGHT * s;

    // Centering offset (applies when doc < viewport)
    const centerX = Math.max(0, (vw - docW) / 2);
    const centerY = Math.max(0, (vh - docH) / 2);

    // Clamp user pan when doc > viewport
    let effectivePanX: number, effectivePanY: number;
    if (docW > vw) {
      effectivePanX = Math.min(0, Math.max(vw - docW, p.x));
    } else {
      effectivePanX = centerX;
    }
    if (docH > vh) {
      effectivePanY = Math.min(0, Math.max(vh - docH, p.y));
    } else {
      effectivePanY = centerY;
    }

    // Apply smooth transition for zoom operations
    if (smooth) {
      transformRef.current.style.transition = "transform 0.15s ease-out";
    } else {
      transformRef.current.style.transition = "none";
    }

    transformRef.current.style.transform = `translate(${effectivePanX}px, ${effectivePanY}px) scale(${s})`;
  }, []);

  // ── Scale Computation ─────────────────────────────────────────────────
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;

    const parent = containerRef.current.parentElement;
    if (!parent) return;

    const containerWidth = parent.clientWidth;
    const containerHeight = parent.clientHeight;

    const PADDING = 48;
    const availableWidth = Math.max(containerWidth - PADDING, 100);
    const availableHeight = Math.max(containerHeight - PADDING, 100);

    const fitWidth = availableWidth / A4_WIDTH;
    const fitHeight = availableHeight / A4_HEIGHT;

    let newScale: number;
    const fm = fitMode;

    if (fm === "width") {
      newScale = fitWidth;
    } else if (fm === "height") {
      newScale = fitHeight;
    } else if (fm === "page") {
      newScale = Math.min(fitWidth, fitHeight);
    } else {
      newScale = manualZoom;
    }

    newScale = Math.min(Math.max(newScale, MIN_ZOOM), MAX_ZOOM);

    setScale(newScale);
    scaleRef.current = newScale;
  }, [fitMode, manualZoom]);

  // Update scale on resize or fit mode change
  useEffect(() => {
    if (!containerRef.current) return;
    const parent = containerRef.current.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver(() => {
      updateScale();
    });
    observer.observe(parent);
    updateScale();

    return () => observer.disconnect();
  }, [updateScale]);

  // Apply transform after scale/pageCount changes
  useEffect(() => {
    computeAndApplyTransform();
  }, [scale, computeAndApplyTransform]);

  // ── Page Count Detection ──────────────────────────────────────────────
  useEffect(() => {
    const iframe = document.getElementById("preview-iframe") as HTMLIFrameElement | null;
    if (!iframe) return;

    const checkHeight = () => {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc?.body) return;
      const scrollHeight = doc.body.scrollHeight;
      const computedPages = Math.max(1, Math.ceil(scrollHeight / 1120));
      setPageCount(computedPages);
    };

    const interval = setInterval(checkHeight, 1000);
    return () => clearInterval(interval);
  }, [html]);

  // ── Mini Nav Auto-Hide ────────────────────────────────────────────────
  const showMiniNavTemporarily = useCallback(() => {
    setShowMiniNav(true);
    clearTimeout(miniNavTimer.current);
    miniNavTimer.current = setTimeout(() => setShowMiniNav(false), MINI_NAV_HIDE_DELAY);
  }, []);

  useEffect(() => {
    return () => clearTimeout(miniNavTimer.current);
  }, []);

  // ── Cursor-Centered Zoom ──────────────────────────────────────────────
  const handleZoomAtPoint = useCallback((clientX: number, clientY: number, zoomIn: boolean) => {
    if (!viewportRef.current || !transformRef.current) return;

    const rect = viewportRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const oldScale = scaleRef.current;
    const worldX = (mouseX - panRef.current.x) / oldScale;
    const worldY = (mouseY - panRef.current.y) / oldScale;

    const factor = zoomIn ? 1 + ZOOM_STEP : 1 - ZOOM_STEP;
    const newScale = Math.min(Math.max(oldScale * factor, MIN_ZOOM), MAX_ZOOM);
    const newPanX = mouseX - worldX * newScale;
    const newPanY = mouseY - worldY * newScale;

    setFitMode(null);
    setManualZoom(newScale);
    setZoom(newScale);
    scaleRef.current = newScale;
    panRef.current = { x: newPanX, y: newPanY };
    setPan({ x: newPanX, y: newPanY });
    setScale(newScale);

    computeAndApplyTransform(true); // smooth
    showMiniNavTemporarily();
  }, [computeAndApplyTransform, showMiniNavTemporarily]);

  // ── Panning ───────────────────────────────────────────────────────────
  const startPan = useCallback((clientX: number, clientY: number) => {
    dragRef.current = {
      isDragging: true,
      startX: clientX,
      startY: clientY,
      startPanX: panRef.current.x,
      startPanY: panRef.current.y,
      wasPanning: false,
    };
  }, []);

  const applyPanDelta = useCallback((clientX: number, clientY: number) => {
    const drag = dragRef.current;
    if (!drag.isDragging) return;

    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;

    if (!drag.wasPanning && (Math.abs(dx) > PAN_THRESHOLD || Math.abs(dy) > PAN_THRESHOLD)) {
      drag.wasPanning = true;
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    }

    if (drag.wasPanning) {
      const newPanX = drag.startPanX + dx;
      const newPanY = drag.startPanY + dy;
      panRef.current = { x: newPanX, y: newPanY };
      computeAndApplyTransform(false); // no smooth for pan
      setIsPanning(true);
    }
  }, [computeAndApplyTransform]);

  const stopPan = useCallback((e: MouseEvent) => {
    const drag = dragRef.current;
    if (!drag.isDragging) return;
    drag.isDragging = false;

    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    if (drag.wasPanning) {
      setIsPanning(false);
      setPan({ ...panRef.current });
      showMiniNavTemporarily();
    } else {
      // Click without drag → forward to iframe for text selection
      setIsPanning(false);
      forwardClickToIframe(e);
    }
  }, [showMiniNavTemporarily]);

  // ── Forward Clicks to Iframe ──────────────────────────────────────────
  // Briefly hides the overlay so the iframe receives native events.
  // The overlay auto-restores on mouseup or after a short delay.
  const forwardClickToIframe = useCallback((e: MouseEvent) => {
    const iframe = document.getElementById("preview-iframe") as HTMLIFrameElement | null;
    if (!iframe || !iframe.contentWindow) return;

    iframe.contentWindow.focus();
    setIsIframeActive(true);

    if (overlayRef.current) {
      overlayRef.current.style.pointerEvents = "none";
    }

    // Re-enable overlay when user releases the mouse in the iframe
    const restoreOverlay = () => {
      setIsIframeActive(false);
      if (overlayRef.current) {
        overlayRef.current.style.pointerEvents = "auto";
      }
      document.removeEventListener("mouseup", restoreOverlay);
    };

    clearTimeout(hideOverlayTimer.current);
    document.addEventListener("mouseup", restoreOverlay, { once: true });
    // Fallback: restore after a generous timeout
    hideOverlayTimer.current = setTimeout(() => {
      document.removeEventListener("mouseup", restoreOverlay);
      restoreOverlay();
    }, 3000);
  }, []);

  // Clean up overlay timer
  useEffect(() => {
    return () => {
      clearTimeout(hideOverlayTimer.current);
    };
  }, []);

  // ── Document-level mouse handlers for panning outside the overlay ─────
  useEffect(() => {
    const handleDocMouseMove = (e: MouseEvent) => {
      if (dragRef.current.isDragging) {
        applyPanDelta(e.clientX, e.clientY);
      }
    };
    const handleDocMouseUp = (e: MouseEvent) => {
      if (dragRef.current.isDragging) {
        stopPan(e);
      }
    };
    document.addEventListener("mousemove", handleDocMouseMove);
    document.addEventListener("mouseup", handleDocMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleDocMouseMove);
      document.removeEventListener("mouseup", handleDocMouseUp);
    };
  }, [applyPanDelta, stopPan]);

  // ── Event Handlers ────────────────────────────────────────────────────

  // ── Pinch Zoom via wheel events (trackpad) ───────────────────────
  // macOS/Windows trackpad pinch gestures fire wheel events with ctrlKey=true
  // and a proportional deltaY value, so we compute a continuous zoom factor.
  const handlePinchZoom = useCallback((clientX: number, clientY: number, deltaY: number) => {
    if (!viewportRef.current || !transformRef.current) return;

    const rect = viewportRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const oldScale = scaleRef.current;
    const worldX = (mouseX - panRef.current.x) / oldScale;
    const worldY = (mouseY - panRef.current.y) / oldScale;

    // Continuous zoom factor from deltaY — works for both trackpad pinch and mouse wheel
    const factor = Math.pow(1.002, -deltaY);
    const newScale = Math.min(Math.max(oldScale * factor, MIN_ZOOM), MAX_ZOOM);
    const newPanX = mouseX - worldX * newScale;
    const newPanY = mouseY - worldY * newScale;

    setFitMode(null);
    setManualZoom(newScale);
    setZoom(newScale);
    scaleRef.current = newScale;
    panRef.current = { x: newPanX, y: newPanY };
    setPan({ x: newPanX, y: newPanY });
    setScale(newScale);

    computeAndApplyTransform(false); // smooth=false for continuous pinch
    showMiniNavTemporarily();
  }, [computeAndApplyTransform, showMiniNavTemporarily]);

  // Mouse wheel: normal scroll (pan) or zoom (Ctrl/Cmd — handles trackpad pinch)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        // Continuous zoom from wheel delta — smooth for both mouse and trackpad pinch
        handlePinchZoom(e.clientX, e.clientY, e.deltaY);
      } else {
        e.preventDefault();
        const dx = e.shiftKey ? -e.deltaY * SCROLL_SPEED : -e.deltaX * SCROLL_SPEED;
        const dy = e.shiftKey ? -e.deltaX * SCROLL_SPEED : -e.deltaY * SCROLL_SPEED;

        panRef.current = {
          x: panRef.current.x + dx,
          y: panRef.current.y + dy,
        };
        computeAndApplyTransform(false);
        setPan({ ...panRef.current });
      }
    },
    [handleZoomAtPoint, computeAndApplyTransform]
  );

  // Mouse down on overlay: start potential pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if (e.detail >= 2) return; // ignore second click of double-click
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        forwardClickToIframe(e.nativeEvent);
        return;
      }
      e.preventDefault();
      startPan(e.clientX, e.clientY);
    },
    [startPan, forwardClickToIframe]
  );

  // Double-click: toggle fit page / 100%
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      // Cancel any pending click-forward
      clearTimeout(hideOverlayTimer.current);
      if (overlayRef.current) {
        overlayRef.current.style.pointerEvents = "auto";
      }
      draggingRef.current = false;

      e.preventDefault();
      if (fitMode) {
        setFitMode(null);
        setManualZoom(1);
        setZoom(1);
        scaleRef.current = 1;
        setScale(1);
        setTimeout(() => computeAndApplyTransform(true), 0);
      } else {
        setFitMode("page");
        setZoom("page");
      }
      showMiniNavTemporarily();
    },
    [fitMode, computeAndApplyTransform, showMiniNavTemporarily]
  );

  // Right-click: context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenuPos(null), []);

  // ── Touch Events: Two-Finger Pinch Zoom & Pan ──────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t = e.touches;
      const dist = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
      const midX = (t[0].clientX + t[1].clientX) / 2;
      const midY = (t[0].clientY + t[1].clientY) / 2;
      touchRef.current = {
        initialDist: dist,
        initialScale: scaleRef.current,
        initialPanX: panRef.current.x,
        initialPanY: panRef.current.y,
        initialMidX: midX,
        initialMidY: midY,
        isPinching: true,
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchRef.current.isPinching) {
      e.preventDefault();
      const t = e.touches;
      const currentDist = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
      const ratio = currentDist / touchRef.current.initialDist;

      // Midpoint between the two fingers — used as zoom center AND pan reference
      const midX = (t[0].clientX + t[1].clientX) / 2;
      const midY = (t[0].clientY + t[1].clientY) / 2;

      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;

      const oldScale = touchRef.current.initialScale;
      const oldPanX = touchRef.current.initialPanX;
      const oldPanY = touchRef.current.initialPanY;

      // Use the INITIAL midpoint for the world point — this is the point
      // that should stay visually fixed under the user's fingers.
      const initialRelX = touchRef.current.initialMidX - rect.left;
      const initialRelY = touchRef.current.initialMidY - rect.top;
      const worldX = (initialRelX - oldPanX) / oldScale;
      const worldY = (initialRelY - oldPanY) / oldScale;

      const newScale = Math.min(Math.max(oldScale * ratio, MIN_ZOOM), MAX_ZOOM);

      // Place the world point under the CURRENT midpoint, then correct
      // for the zoom center shift. This naturally handles both pinch and
      // pan simultaneously without double-counting.
      const relX = midX - rect.left;
      const relY = midY - rect.top;
      const newPanX = relX - worldX * newScale;
      const newPanY = relY - worldY * newScale;

      setFitMode(null);
      setManualZoom(newScale);
      setZoom(newScale);
      scaleRef.current = newScale;
      panRef.current = { x: newPanX, y: newPanY };
      setPan({ x: newPanX, y: newPanY });
      setScale(newScale);
      computeAndApplyTransform(false);
    }
  }, [computeAndApplyTransform]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2 && touchRef.current.isPinching) {
      touchRef.current.isPinching = false;
      setPan({ ...panRef.current });
      showMiniNavTemporarily();
    }
  }, [showMiniNavTemporarily]);

  // ── Hover detection for cursor ───────────────────────────────────────
  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  // ── Context Menu Actions ──────────────────────────────────────────────
  const handleFitPage = useCallback(() => {
    setFitMode("page");
    setZoom("page");
    showMiniNavTemporarily();
  }, [showMiniNavTemporarily]);

  const handleFitWidth = useCallback(() => {
    setFitMode("width");
    setZoom("width");
    showMiniNavTemporarily();
  }, [showMiniNavTemporarily]);

  const handleFitHeight = useCallback(() => {
    setFitMode("height");
    setZoom("height");
    showMiniNavTemporarily();
  }, [showMiniNavTemporarily]);

  const handleZoomTo = useCallback(
    (level: number) => {
      setFitMode(null);
      setManualZoom(level);
      setZoom(level);
      scaleRef.current = level;
      setScale(level);
      setTimeout(() => computeAndApplyTransform(true), 0);
      showMiniNavTemporarily();
    },
    [computeAndApplyTransform, showMiniNavTemporarily]
  );

  const handleResetView = useCallback(() => {
    setFitMode("page");
    setZoom("page");
    panRef.current = { x: 0, y: 0 };
    setPan({ x: 0, y: 0 });
    showMiniNavTemporarily();
  }, [showMiniNavTemporarily]);

  // ── PDF Export & Print ────────────────────────────────────────────────
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

  const handleDownloadHTML = useCallback(() => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.html";
    a.click();
    URL.revokeObjectURL(url);
  }, [html]);

  // ── Keyboard Shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editorRef.current && document.activeElement?.closest(".monaco-editor")) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "=":
          case "+":
            e.preventDefault();
            handleZoomAtPoint(window.innerWidth / 2, window.innerHeight / 2, true);
            break;
          case "-":
            e.preventDefault();
            handleZoomAtPoint(window.innerWidth / 2, window.innerHeight / 2, false);
            break;
          case "0":
            e.preventDefault();
            handleFitPage();
            break;
          case "1":
            e.preventDefault();
            handleZoomTo(1);
            break;
          case "s":
            e.preventDefault();
            triggerSave();
            break;
        }
      }
      if (e.key === "Escape") {
        if (contextMenuPos) closeContextMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleZoomAtPoint, handleFitPage, handleZoomTo, triggerSave, contextMenuPos, closeContextMenu]);

  // ── Template Loading ──────────────────────────────────────────────────
  useEffect(() => {
    if (selectedTemplate !== "default") {
      fetch(`/templates/${selectedTemplate}_resume.html`)
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.text();
        })
        .then((t) => {
          setHtml(t);
          setSaveStatus("unsaved");
        })
        .catch(() => {});
    }
  }, [selectedTemplate]);

  // ── Editor ────────────────────────────────────────────────────────────
  const handleEditorChange = (value?: string) => {
    if (value !== undefined) setHtml(value);
  };

  const resetTemplate = () => {
    fetch(DEFAULT_TEMPLATE_URL)
      .then((r) => r.text())
      .then((t) => {
        setHtml(t);
        setSaveStatus("unsaved");
      })
      .catch(() => setHtml("<div>No template found</div>"));
  };

  const handleFormat = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run();
    }
  }, []);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPos({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });
  };

  // ── Layout Persistence ────────────────────────────────────────────────
  const [panelSize, setPanelSize] = useState<number>(55);
  useEffect(() => {
    const savedSize = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (savedSize) setPanelSize(parseFloat(savedSize));
  }, []);

  const handleLayoutResize = (sizes: number[]) => {
    if (sizes && sizes.length > 0) {
      localStorage.setItem(LAYOUT_STORAGE_KEY, sizes[0].toString());
    }
  };

  // ── Navigate Pages ────────────────────────────────────────────────────
  const goToPage = useCallback((page: number) => {
    const target = Math.max(1, Math.min(page, pageCount));
    setCurrentPage(target);
    showMiniNavTemporarily();

    // Scroll to the target page by adjusting pan Y
    // Each page is A4_HEIGHT px tall. Offset from top = (target - 1) * A4_HEIGHT * scale
    const targetY = -(target - 1) * A4_HEIGHT * scaleRef.current;
    panRef.current = { ...panRef.current, y: targetY };
    setPan({ ...panRef.current });
    computeAndApplyTransform(false);
  }, [pageCount, showMiniNavTemporarily, computeAndApplyTransform]);

  const goToPrevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  // Sync currentPage when pan changes (e.g., user scrolls)
  useEffect(() => {
    // Only sync when not dragging
    if (dragRef.current.isDragging) return;
    const page = Math.max(1, Math.min(pageCount, Math.round(-pan.y / (A4_HEIGHT * scale)) + 1));
    setCurrentPage(page);
  }, [pan.y, scale, pageCount]);

  // ── Derived Values ────────────────────────────────────────────────────
  const zoomPercent = fitMode
    ? fitMode === "page"
      ? `Fit Page`
      : fitMode === "width"
        ? `Fit Width`
        : `Fit Height`
    : `${Math.round(scale * 100)}%`;

  // Cursor style for the viewport
  const viewportCursor = isPanning
    ? "grabbing"
    : isIframeActive
      ? "text"
      : isHovering
        ? "grab"
        : "default";

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <TopNavbar
        html={html}
        setHtml={setHtml}
        onReset={resetTemplate}
        zoom={zoom}
        setZoom={handleSetZoom}
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
                  },
                }}
              />
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-1.5 bg-slate-800 hover:bg-indigo-600 active:bg-indigo-500 cursor-col-resize transition-all duration-150 z-10 flex items-center justify-center">
            <div className="w-[2px] h-6 bg-slate-600 rounded-full" />
          </PanelResizeHandle>

          {/* ── Interactive Preview Panel ───────────────────────────────── */}
          <Panel defaultSize={100 - panelSize} minSize={30} maxSize={70} className="bg-[#ececec] relative h-full overflow-hidden">
            <div
              ref={viewportRef}
              className="relative w-full h-full overflow-hidden"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onDoubleClick={handleDoubleClick}
              style={{ cursor: viewportCursor }}
            >
              {/* ── Transform Container ── */}
              <div
                ref={transformRef}
                className="absolute top-0 left-0"
                style={{
                  transformOrigin: "0 0",
                  willChange: "transform",
                }}
              >
                {/* Single A4 page with iframe */}
                <div
                  className="bg-white shadow-2xl rounded-md overflow-hidden border border-black/5 flex-shrink-0"
                  style={{
                    width: `${A4_WIDTH}px`,
                    height: `${A4_HEIGHT}px`,
                  }}
                >
                  <iframe
                    id="preview-iframe"
                    title="Resume Preview"
                    srcDoc={html}
                    className="w-full h-full border-none bg-white"
                    style={{ userSelect: "text", pointerEvents: "auto" }}
                  />
                </div>
              </div>

              {/* ── Interaction Capture Overlay ── */}
              <div
                ref={overlayRef}
                className="absolute inset-0 z-10"
                style={{ touchAction: "none" }}
                onContextMenu={handleContextMenu}
                onMouseDown={handleMouseDown}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />

              {/* ── Page Navigation ── */}
              {pageCount > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-slate-200/60 select-none">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage <= 1}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                    title="Previous Page"
                  >
                    ◀
                  </button>
                  <span className="text-xs font-semibold text-slate-700 min-w-[60px] text-center tabular-nums">
                    {currentPage} / {pageCount}
                  </span>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage >= pageCount}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                    title="Next Page"
                  >
                    ▶
                  </button>
                </div>
              )}

              {/* ── Mini Navigation HUD ── */}
              {showMiniNav && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-white/85 backdrop-blur-md rounded-lg px-3 py-1.5 shadow-lg border border-slate-200/60 select-none transition-opacity duration-300">
                  <span className="text-[11px] font-semibold text-slate-700 tabular-nums">
                    {zoomPercent}
                  </span>
                  <span className="w-[3px] h-[3px] rounded-full bg-slate-400" />
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    {currentPage}/{pageCount}
                  </span>
                  {fitMode && (
                    <>
                      <span className="w-[3px] h-[3px] rounded-full bg-slate-400" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-500">
                        {fitMode}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* ── Context Menu ── */}
              {contextMenuPos && (
                <PreviewContextMenu
                  x={contextMenuPos.x}
                  y={contextMenuPos.y}
                  onClose={closeContextMenu}
                  onFitPage={handleFitPage}
                  onFitWidth={handleFitWidth}
                  onFitHeight={handleFitHeight}
                  onZoomTo={handleZoomTo}
                  onPrint={handlePrint}
                  onExportPDF={handleExportPDF}
                  onResetView={handleResetView}
                />
              )}
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
          <span className="cursor-pointer hover:text-slate-200" onClick={() => setWordWrapEnabled((w) => (w === "on" ? "off" : "on"))}>
            Wrap: {wordWrapEnabled.toUpperCase()}
          </span>
          <span className="text-slate-600">|</span>
          <span className="cursor-pointer hover:text-slate-200" onClick={() => setMinimapEnabled((m) => !m)}>
            Minimap: {minimapEnabled ? "ON" : "OFF"}
          </span>
        </div>
        <div className="flex items-center space-x-4 font-mono text-[11px]">
          <span>UTF-8</span>
          <span className="text-slate-600">|</span>
          <span>
            Ln {cursorPos.line}, Col {cursorPos.column}
          </span>
          <span className="text-slate-600">|</span>
          <span>Size: {(html.length / 1024).toFixed(1)} KB</span>
        </div>
      </footer>
    </div>
  );
}
