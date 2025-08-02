import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/auth/auth-provider";
import ProtectedLayout from "@/components/protected-layout";
import { cn } from "@/lib/utils";
import Navbar from "@/components/navbar";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Teachers Academy",
  description: "Teachers Academy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(
        "min-h-screen font-sans antialiased",
        poppins.variable
      )}>
        <AuthProvider>
          <ProtectedLayout>
            {children}
          </ProtectedLayout>
        </AuthProvider>
      </body>
    </html>
  );
}