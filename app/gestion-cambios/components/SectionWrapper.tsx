type SectionWrapperProps = {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
};

export function SectionWrapper({ title, icon, children }: SectionWrapperProps) {
  return (
    <section className="min-w-0 rounded-lg border border-[#dfe7f2] bg-white px-5 py-5 shadow-sm sm:px-7">
      <div className="mb-4 flex">
        <h2 className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-slate-50 px-3 py-1 text-sm font-black uppercase text-[#020a1f]">
          {icon ? <span className="grid size-7 place-items-center rounded-md bg-white text-blue-600 shadow-sm ring-1 ring-slate-200 [&_svg]:size-4">{icon}</span> : null}
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
