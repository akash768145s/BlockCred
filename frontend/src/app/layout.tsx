import type { Metadata } from "next";
import {
  Poppins,
  Inter,
  Nunito_Sans,
  Roboto,
  Merriweather
} from "next/font/google";
import "./globals.css";

// Logo / Headings - Futuristic + bold
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Body / UI text - Readable & minimal
const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// Certificates - Academic aesthetic
const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "BlockCred",
  description: "Blockchain-based credential management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${inter.variable} ${nunitoSans.variable} ${roboto.variable} ${merriweather.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
