"use client";

import Image from "next/image";
import { Eraser, PenLine, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SignaturePadProps = {
  value?: string;
  label?: string;
  onChange: (value: string) => void;
};

export function SignaturePad({ value, label = "Firma del aprobador", onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [draftSignature, setDraftSignature] = useState(value ?? "");

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    context?.clearRect(0, 0, canvas.width, canvas.height);
    if (!draftSignature) return;

    const image = new window.Image();
    image.onload = () => context?.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.src = draftSignature;
  }, [draftSignature, isOpen]);

  const openModal = () => {
    setDraftSignature(value ?? "");
    setIsOpen(true);
  };

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
    };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const context = canvas.getContext("2d");
    if (!context) return;

    const point = getPoint(event);
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#0f172a";
    drawingRef.current = true;
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;

    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const finishDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDraftSignature(event.currentTarget.toDataURL("image/png"));
  };

  const clearDraft = () => {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setDraftSignature("");
  };

  const confirmSignature = () => {
    if (!draftSignature) return;
    onChange(draftSignature);
    setIsOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-wide text-slate-600">{label}</span>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800"
        >
          <PenLine className="size-4" />
          {value ? "Actualizar firma" : "Firmar"}
        </button>
      </div>

      {value ? (
        <div className="relative h-28 overflow-hidden rounded-md border border-slate-300 bg-white">
          <Image src={value} alt="Firma registrada del aprobador" fill unoptimized className="object-contain p-2" />
        </div>
      ) : (
        <div className="grid min-h-24 place-items-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-500">
          Firma pendiente
        </div>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="signature-modal-title">
          <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 id="signature-modal-title" className="text-lg font-black text-slate-800">
                {label}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar firma"
                title="Cerrar"
                className="grid size-10 place-items-center rounded-md border border-slate-300 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <X className="size-5" />
              </button>
            </div>

            <canvas
              ref={canvasRef}
              width={900}
              height={300}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={finishDrawing}
              onPointerCancel={finishDrawing}
              className="mt-4 h-48 w-full touch-none rounded-md border border-slate-300 bg-white sm:h-52"
            />

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={clearDraft}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Eraser className="size-4" />
                Limpiar
              </button>
              <button
                type="button"
                onClick={confirmSignature}
                disabled={!draftSignature}
                className="inline-flex h-11 items-center justify-center rounded-md bg-blue-700 px-6 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
