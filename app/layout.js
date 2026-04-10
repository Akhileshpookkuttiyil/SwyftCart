import { Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";

const outfit = Outfit({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700"] 
});

export const metadata = {
  title: "SwyftCart",
  description: "Modern E-Commerce Store",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} antialiased text-gray-700`}>
        <ClerkProvider>
          <AppContextProvider>
            <Toaster position="bottom-right" />
            {children}
          </AppContextProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
