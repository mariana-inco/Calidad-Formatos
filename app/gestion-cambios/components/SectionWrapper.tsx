type SectionWrapperProps = {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
};

export function SectionWrapper({ title, icon, children }: SectionWrapperProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 sm:p-8">
      <div className="mb-8 flex">
        <h2 className="inline-flex min-h-11 items-center gap-3 rounded-full border border-emerald-900/10 bg-emerald-50/70 px-5 text-base font-bold uppercase text-emerald-950 shadow-sm">
          {icon ? <span className="text-teal-700">{icon}</span> : null}
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
