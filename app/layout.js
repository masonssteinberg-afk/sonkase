import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://sonkase.com"),
  title: "Sonkase™ — Private Dining · Gainesville, FL",
  description: "Private omakase sushi dining in Gainesville, FL. A personal chef in your home, rolling course by course for your guests.",
  openGraph: {
    title: "The Sonkase Experience",
    description: "In-home personal sushi chef for gatherings in Gainesville, FL.",
    url: "https://sonkase.com",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Sonkase Experience",
    description: "In-home personal sushi chef for gatherings in Gainesville, FL.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
