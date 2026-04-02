// app/layout.js
import { Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import ClientOnly from "@/components/ClientOnly"; // we'll create this

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500"] });

export const metadata = {
  title: "SwyftCart - GreatStack",
  description: "E-Commerce with Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased text-gray-700`}>
        <ClerkProvider>
          <ClientOnly>
            <Toaster />
            <AppContextProvider>{children}</AppContextProvider>
          </ClientOnly>
        </ClerkProvider>
      </body>
    </html>
  );
}
