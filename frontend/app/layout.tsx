import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import BackgroundDots from "@/components/BackgroundDots";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden md:overflow-hidden`}
      >
        <div className="bg-blob-top-right"></div>
        <div className="bg-blob-bottom-left"></div>
        <BackgroundDots />
        <Header />

        {/* Main wrapper handles spacing */}
        <main className="pt-[95px] md:pt-0 ">{children}</main>
        <Toaster
          containerStyle={{ top: 10 }}
          position="top-center"
          toastOptions={{ duration: 3000 }}
        />
      </body>
    </html>
  );
}
