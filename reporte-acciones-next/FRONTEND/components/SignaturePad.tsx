"use client";

import Signature, { type SignatureCanvasRef } from "@uiw/react-signature/canvas";
import { Eraser, PenLine, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

export function SignaturePad({
  value,
  label,
  onChange,
}: {
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<SignatureCanvasRef>(null);
  const [open, setOpen] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);

  const clear = () => {
    ref.current?.clear();
    setHasStroke(false);
  };

  const confirm = () => {
    const canvas = ref.current?.canvas;
    if (!canvas || !hasStroke) return;
    onChange(canvas.toDataURL("image/png"));
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          setHasStroke(false);
          setOpen(true);
        }}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-800"
      >
        <PenLine className="size-4" />
        {value ? "Actualizar firma" : "Firmar"}
      </button>

      {value ? (
        <div className="relative h-24 overflow-hidden rounded-md border border-slate-200 bg-white">
          <Image src={value} alt={label} fill unoptimized className="object-contain p-2" />
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/70 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-black text-slate-900">{label}</h3>
              <button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-md border border-slate-300" aria-label="Cerrar">
                <X className="size-5" />
              </button>
            </div>
            <Signature
              ref={ref}
              width={900}
              height={300}
              options={{ size: 4, thinning: 0.45, smoothing: 0.65 }}
              onPointer={(points) => points.length > 0 && setHasStroke(true)}
              className="mt-4 h-52 w-full touch-none rounded-md border border-slate-300 bg-white"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={clear} className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 px-5 font-bold">
                <Eraser className="size-4" /> Limpiar
              </button>
              <button type="button" onClick={confirm} disabled={!hasStroke} className="h-11 rounded-md bg-blue-700 px-6 font-bold text-white disabled:bg-slate-300">
                Continuar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
