import type { Metadata } from "next";
import "@/FRONTEND/styles/globals.css";

export const metadata: Metadata = {
  title: "Reporte de Acciones",
  description: "Formato web para reporte de acciones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
