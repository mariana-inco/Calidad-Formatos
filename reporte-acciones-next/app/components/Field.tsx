type FieldProps = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
};

export function Field({ id, label, icon, children }: FieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="flex items-center gap-2 text-sm font-bold leading-5 text-[#020a1f]">
        {icon ? <span className="inline-flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">{icon}</span> : null}
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

export const inputClassName =
  "h-10 w-full rounded-md border border-[#b8c2cf] bg-white px-3 text-sm font-medium text-[#18314f] outline-none transition placeholder:text-[#8a9ab5] focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100";

export const textareaClassName =
  "min-h-24 w-full resize-y rounded-md border border-[#b8c2cf] bg-white px-3 py-2.5 text-sm font-medium text-[#18314f] outline-none transition placeholder:text-[#8a9ab5] focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100";
