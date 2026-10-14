/** One heading, one plain sentence. Every admin page opens the same way. */
export function PageIntro({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="max-w-[62ch] py-9">
      <h1 className="text-[clamp(1.6rem,3vw,2.1rem)] font-bold leading-tight tracking-[-0.03em]">
        {title}
      </h1>
      <p className="mt-3 text-[15.5px] leading-[1.6] text-mute">{blurb}</p>
    </div>
  );
}
