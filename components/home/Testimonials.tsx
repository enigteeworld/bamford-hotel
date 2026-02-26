export default function Testimonials({
  kicker,
  title,
  items,
}: {
  kicker: string;
  title: string;
  items: Array<{ name: string; role: string; text: string; image: string }>;
}) {
  return (
    <section className="lux-section">
      <div className="lux-container">
        <div className="text-center">
          <div className="lux-kicker">{kicker}</div>
          <h2 className="lux-h2 mt-3">{title}</h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((t, idx) => (
            <div key={idx} className="lux-card lux-border rounded-3xl bg-white p-8 text-center">
              <div className="mx-auto h-24 w-24 rounded-full overflow-hidden bg-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.image || "/placeholder.jpg"} alt={t.name} className="h-full w-full object-cover" />
              </div>

              <div className="mt-5 text-sm font-semibold tracking-[0.18em] uppercase">{t.name}</div>
              <div className="mt-1 text-sm text-[var(--accent)] italic">{t.role}</div>

              <p className="mt-5 text-sm leading-7 text-black/60">{t.text}</p>

              <div className="mt-6 flex items-center justify-center">
                {/* small twitter icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" className="text-black/45" fill="currentColor">
                  <path d="M22 5.8c-.7.3-1.4.5-2.2.6.8-.5 1.3-1.2 1.6-2.1-.7.4-1.5.7-2.4.9-.7-.7-1.6-1.1-2.7-1.1-2 0-3.7 1.7-3.7 3.8 0 .3 0 .6.1.9-3.1-.2-5.8-1.7-7.7-4.2-.3.6-.5 1.2-.5 2 0 1.3.6 2.4 1.6 3.1-.6 0-1.1-.2-1.6-.5v.1c0 1.8 1.2 3.3 2.9 3.7-.3.1-.7.1-1 .1-.2 0-.5 0-.7-.1.5 1.6 2 2.8 3.7 2.8-1.4 1.1-3.2 1.8-5.1 1.8H2c1.9 1.2 4.1 1.9 6.5 1.9 7.8 0 12.1-6.6 12.1-12.3v-.6c.8-.6 1.4-1.2 1.9-2z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
