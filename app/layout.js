// app/layout.js
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import { Outfit } from "next/font/google";
import ClientWrapper from "./ClientWrapper";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500"] });

export const metadata = {
  title: "SwyftCart - GreatStack",
  description: "E-Commerce with Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased text-gray-700">
        <ClerkProvider>
          <AppContextProvider>
            <ClientWrapper>
              <Toaster />
              {children}
            </ClientWrapper>
          </AppContextProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
