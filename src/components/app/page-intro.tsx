export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">{eyebrow}</p>
      <div className="space-y-2">
        <h2 className="text-[2.1rem] font-semibold tracking-[-0.045em] text-neutral-950 sm:text-[2.35rem]">{title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-neutral-500 sm:text-[15px]">{description}</p>
      </div>
    </section>
  );
}
