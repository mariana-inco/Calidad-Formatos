type SectionWrapperProps = {
  children: React.ReactNode;
};

export function SectionWrapper({ children }: SectionWrapperProps) {
  return (
    <section className="min-w-0 rounded-lg border border-[#dfe7f2] bg-white px-5 py-5 shadow-sm sm:px-7">
      {children}
    </section>
  );
}
