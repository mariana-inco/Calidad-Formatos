type SectionWrapperProps = {
  children: React.ReactNode;
};

export function SectionWrapper({ children }: SectionWrapperProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {children}
    </section>
  );
}
