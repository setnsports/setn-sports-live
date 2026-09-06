import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SETN Sports Live",
  description: "Southeast Tennessee Sports Network live gamecast prototype",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
