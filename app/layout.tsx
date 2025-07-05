import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/auth-context";

export const metadata: Metadata = {
  title: "Astral Tickets - Sistema de Boletería",
  description: "Sistema de gestión de boletos y eventos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
