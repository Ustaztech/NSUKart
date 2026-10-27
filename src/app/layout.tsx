import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "NSUKart — Your Campus. Your Marketplace.",
    template: "%s | NSUKart",
  },
  description:
    "Discover campus essentials and shop from independent vendors in the Nasarawa State University, Keffi community.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-NG">
      <body>
        <script dangerouslySetInnerHTML={{__html: `try{document.documentElement.dataset.theme=localStorage.getItem("nsukart-theme")==="dark"?"dark":"light"}catch{document.documentElement.dataset.theme="light"}`}} />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
