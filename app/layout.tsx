import type { Metadata } from "next";
import "./globals.css";

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
          <div className="brand">
            <span className="dot" />
            Greenshades
          </div>
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
