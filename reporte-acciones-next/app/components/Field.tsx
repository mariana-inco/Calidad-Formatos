type FieldProps = {
  id: string;
  label: string;
  children: React.ReactNode;
};

export function Field({ id, label, children }: FieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

export const inputClassName =
  "min-h-12 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-100";

export const textareaClassName =
  "min-h-28 w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-100";
