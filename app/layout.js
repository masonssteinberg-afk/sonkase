import "./globals.css";

export const metadata = {
  title: "Sonkase™ — Private Dining · Gainesville, FL",
  description: "Private omakase sushi dining in Gainesville, FL. A personal chef in your home, rolling course by course for your guests.",
  openGraph: {
    title: "Sonkase™ — Private Dining",
    description: "Private omakase sushi dining in Gainesville, FL.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sonkase™ — Private Dining",
    description: "Private omakase sushi dining in Gainesville, FL.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
