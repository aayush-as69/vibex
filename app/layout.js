import "./globals.css";

export const metadata = {
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
