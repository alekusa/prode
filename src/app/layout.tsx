import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prode Argentino - Liga Profesional",
  description: "Jugá al prode oficial de la Liga Profesional de Fútbol.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen pb-20`}
      >
        <AuthProvider>
          <Navbar />
          <main className="pt-20 px-4 w-full">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
