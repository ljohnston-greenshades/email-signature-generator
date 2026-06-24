import type { Metadata } from "next";
import "./globals.css";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Greenshades Email Signature Builder",
  description:
    "Build a personalized, brand-compliant Greenshades email signature for Outlook.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a href="/" className="brand" aria-label="Greenshades home">
            <Logo height={30} />
          </a>
          <nav>
            <a href="/">Signature Builder</a>
            <a href="/marketing">Marketing</a>
          </nav>
        </header>
        {children}
        <footer className="footer">
          Greenshades Email Signature Builder · Built to brand standards · Questions? Contact
          Marketing.
        </footer>
      </body>
    </html>
  );
}
