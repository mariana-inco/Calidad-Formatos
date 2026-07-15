type SectionWrapperProps = {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
};

export function SectionWrapper({ title, icon, children }: SectionWrapperProps) {
  return (
    <section className="min-w-0 rounded-lg border border-[#dfe7f2] bg-white px-3 py-4 shadow-sm sm:px-7 sm:py-5">
      <div className="mb-4 flex">
        <h2 className="inline-flex min-h-9 min-w-0 max-w-full items-center gap-2 rounded-lg bg-slate-50 px-3 py-1 text-xs font-black uppercase leading-5 text-[#020a1f] sm:text-sm">
          {icon ? <span className="grid size-7 place-items-center rounded-md bg-white text-blue-600 shadow-sm ring-1 ring-slate-200 [&_svg]:size-4">{icon}</span> : null}
          <span className="min-w-0 break-words">{title}</span>
        </h2>
      </div>
      {children}
    </section>
  );
}
