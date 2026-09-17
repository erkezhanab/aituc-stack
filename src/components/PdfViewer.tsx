"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/client";

const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";
const WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

/** Renders a PDF from `src` inline with PDF.js (all pages, one canvas per page). */
export function PdfViewer({ src, height = 640 }: { src: string; height?: number }) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [pages, setPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const container = ref.current!;
    container.innerHTML = "";
    (async () => {
      try {
        const pdfjs = await import(/* webpackIgnore: true */ PDFJS);
        pdfjs.GlobalWorkerOptions.workerSrc = WORKER;
        const doc = await pdfjs.getDocument(src).promise;
        if (cancelled) return;
        setPages(doc.numPages);
        const width = container.clientWidth || 800;
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const scale = (width - 16) / base.width;
          const viewport = page.getViewport({ scale: scale * window.devicePixelRatio });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${viewport.width / window.devicePixelRatio}px`;
          canvas.className = "mx-auto mb-2 block border border-line bg-white";
          container.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
          if (cancelled) return;
        }
        setState("ok");
      } catch (e) {
        console.error(e);
        setState("error");
      }
    })();
    return () => { cancelled = true; };
  }, [src]);

  return (
    <div className="card overflow-hidden">
      <div className="flex h-8 items-center justify-between border-b border-line bg-surface-2 px-3 text-[11px] text-muted">
        <span className="font-mono">{state === "loading" ? t("common.pdfLoading") : state === "error" ? t("common.pdfError") : t("common.pages", { n: pages })}</span>
        <a href={src} target="_blank" rel="noreferrer" className="link">{t("common.openDownload")}</a>
      </div>
      <div ref={ref} className="pdf-scroll overflow-auto bg-surface-2 p-2" style={{ maxHeight: height }} />
    </div>
  );
}
