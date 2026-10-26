import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

const lexend = Lexend({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: "Trazo | Arquitectos de tu barrio", template: "%s | Trazo" },
  description: "Publica el proyecto de tu casa con fotos y recibe propuestas de arquitectos que trabajan en tu zona. Compara, conversa y elige.",
};

export const viewport: Viewport = {
  themeColor: "#b85a35",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={lexend.className}>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
