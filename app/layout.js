import "./globals.css";

export const metadata = {
  title: "Sonkase™ — Private Dining · Gainesville, FL",
  description: "Private omakase sushi dining in Gainesville, FL. A personal chef in your home, rolling course by course for your guests.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Sonkase™ — Private Dining",
    description: "In-home personal sushi chef for gatherings in Gainesville, FL.",
    url: "https://sonkase.com",
    type: "website",
    images: [
      {
        url: "https://sonkase.com/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sonkase™ — Private Dining",
    description: "In-home personal sushi chef for gatherings in Gainesville, FL.",
    images: ["https://sonkase.com/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
