type SectionWrapperProps = {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
};

export function SectionWrapper({ title, icon, children }: SectionWrapperProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex">
        <h2 className="inline-flex min-h-8 items-center gap-2 rounded-md bg-slate-50 text-sm font-black uppercase text-[#08142f]">
          {icon ? <span className="text-blue-600">{icon}</span> : null}
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
