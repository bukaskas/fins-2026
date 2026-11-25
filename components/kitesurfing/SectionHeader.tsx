/**
 * The heading row shared by every section below the /kitesurfing hero.
 *
 * One plain sentence-case H2 at one weight, with a short description beside it
 * on wide screens. The page used to open each section with a tracked uppercase
 * eyebrow and a two-line heading whose second word was bold and blue; repeated
 * six times, that made every section look the same and left the hero nothing
 * to stand out against. The hero is now the only place with a display moment.
 */
function SectionHeader({
  id,
  title,
  children,
}: {
  /** Set on the H2 so the section can be labelled by it. */
  id: string;
  title: string;
  /** One or two sentences on what the section is for. */
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between md:gap-10">
      <h2
        id={id}
        className="font-[family-name:var(--font-raleway)] text-[clamp(2rem,3.6vw,3rem)] font-[700] leading-[1.05] tracking-[-0.02em] text-neu-fg"
      >
        {title}
      </h2>
      {children && (
        <p className="max-w-sm font-[family-name:var(--font-raleway)] text-[0.95rem] font-[400] leading-relaxed text-neu-muted">
          {children}
        </p>
      )}
    </div>
  );
}

export default SectionHeader;
