'use client';

import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

type Props = {
  pdfData: Uint8Array | null;
};

export default function PdfPreviewPane({ pdfData }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState<number>(600);
  const [numPages, setNumPages] = React.useState<number>(0);

  // Update width on resize
  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (!pdfData) {
    return <p className="text-gray-600">PDF preview will appear here</p>;
  }

  // @ts-ignore – TypeScript sometimes flags Uint8Array as incompatible with BlobPart
  const blob = new Blob([pdfData], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden bg-[#525659] p-6 flex flex-col items-center gap-6"
      style={{ height: '100%' }}
    >
      <Document
        file={url}
        loading={
          <div className="text-white flex items-center justify-center py-10 font-semibold">
            Loading PDF…
          </div>
        }
        onLoadSuccess={onDocumentLoadSuccess}
        className="flex flex-col gap-6 items-center"
      >
        {Array.from(new Array(numPages), (_, index) => (
          <div key={`page_container_${index + 1}`} className="shadow-lg border border-gray-700 bg-white">
            <Page
              pageNumber={index + 1}
              width={Math.max(280, containerWidth - 48)} // Ensure width doesn't collapse too far, leaving margin for padding
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </div>
        ))}
      </Document>
    </div>
  );
}
