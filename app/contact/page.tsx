import { getSiteContent } from "@/lib/getSiteContent";
import ContactForm from "@/components/contact/ContactForm";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const c = await getSiteContent([
    "contact.kicker",
    "contact.title",
    "contact.subtitle",
    "contact.address",
    "contact.email",
    "contact.phone",
    "contact.mapEmbedUrl",

    "contact.form.name",
    "contact.form.email",
    "contact.form.phone",
    "contact.form.subject",
    "contact.form.message",
    "contact.form.button",
  ]);

  const labels = {
    name: c["contact.form.name"] || "Full Name",
    email: c["contact.form.email"] || "Email Address",
    phone: c["contact.form.phone"] || "Phone Number",
    subject: c["contact.form.subject"] || "Subject",
    message: c["contact.form.message"] || "Message",
    button: c["contact.form.button"] || "Send Message",
  };

  return (
    <main>
      <section className="lux-container pt-14 md:pt-20 pb-10">
        <div className="lux-kicker text-[var(--accent)]">{c["contact.kicker"] || "Contact"}</div>
        <h1 className="mt-4 lux-h1 text-black/90">{c["contact.title"] || "Get in Touch"}</h1>
        <p className="mt-5 max-w-2xl text-sm md:text-base text-black/60 leading-relaxed">
          {c["contact.subtitle"] || ""}
        </p>
      </section>

      <section className="lux-container pb-16 md:pb-20 grid gap-6 lg:grid-cols-[1fr_420px]">
        <ContactForm labels={labels} />

        <aside className="lux-border lux-card rounded-3xl bg-white p-8 md:p-10 h-fit">
          <div className="lux-kicker">Contact Details</div>

          <div className="mt-6 grid gap-4 text-sm text-black/65">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-black/45">Address</div>
              <div className="mt-2">{c["contact.address"] || ""}</div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-black/45">Email</div>
              <div className="mt-2">{c["contact.email"] || ""}</div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-black/45">Phone</div>
              <div className="mt-2">{c["contact.phone"] || ""}</div>
            </div>
          </div>

          {c["contact.mapEmbedUrl"] ? (
            <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)]">
              <iframe
                src={c["contact.mapEmbedUrl"]}
                className="w-full h-[260px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-[var(--line)] bg-black/[0.02] p-4 text-xs text-black/55">
              Optional: add a Google Maps embed URL in Admin → Contact → “Contact Map Embed URL”.
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
