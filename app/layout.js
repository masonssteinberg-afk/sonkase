import "./globals.css";
import Banner from "./components/Banner";

export const metadata = {
  metadataBase: new URL("https://sonakase.com"),
  icons: {
    icon: "/favicon.png",
  },
  title: "Sonakase™ — Private Dining · Gainesville, FL",
  description: "Private omakase sushi dining in Gainesville, FL. A personal chef in your home, rolling course by course for your guests.",
  openGraph: {
    title: "The Sonakase Experience",
    description: "In-home personal sushi chef for gatherings in Gainesville, FL.",
    url: "https://sonakase.com",
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
    title: "The Sonakase Experience",
    description: "In-home personal sushi chef for gatherings in Gainesville, FL.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Banner />
        {children}
      </body>
    </html>
  );
}
