import "./globals.css";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getContentMap } from "@/lib/content";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const c = await getContentMap();

  const address = c["site.topbar.address"] || "9 Crosby Street, New York City";
  const email = c["site.topbar.email"] || "info@luxehotel.com";
  const phone = c["site.topbar.phone"] || "(646) 218-6400";

  const socials = {
    facebook: c["site.social.facebook"] || "#",
    instagram: c["site.social.instagram"] || "#",
    twitter: c["site.social.twitter"] || "#",
  };

  const brandName = c["site.brand.name"] || "LUXE HOTEL";

  const newsletter = {
    title: c["site.newsletter.title"] || "Subscribe to our newsletter",
    subtitle:
      c["site.newsletter.subtitle"] ||
      "Get updates, offers, and hotel news delivered to your inbox.",
    placeholder: c["site.newsletter.placeholder"] || "Enter your email",
    button: c["site.newsletter.button"] || "Subscribe",
  };

  return (
    <html lang="en">
      <body>
        <TopBar
          address={address}
          email={email}
          phone={phone}
          socials={socials}
        />
        <Navbar brandName={brandName} />
        {children}
        <Footer brand={{ name: brandName }} newsletter={newsletter} />

        {/* WhatsApp floating icon on every page */}
        <WhatsAppFloat />
      </body>
    </html>
  );
}