import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import Providers from "@/lib/Providers";

export const metadata = {
  title: "SwyftCart",
  description: "Modern E-Commerce Store",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="antialiased text-gray-700" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <ClerkProvider>
          <Providers>
            <AppContextProvider>
              <Toaster position="bottom-right" />
              {children}
            </AppContextProvider>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
