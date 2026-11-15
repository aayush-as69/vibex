import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "localhost:3000";
const metadataBase = new URL(siteUrl.startsWith("http://") || siteUrl.startsWith("https://") ? siteUrl : `https://${siteUrl}`);

export const metadata = {
  metadataBase,
  title: "VibeX Shield",
  description: "Defensive cyber-safety analysis for suspicious links, messages and code.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
