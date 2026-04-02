// app/ClientWrapper.jsx
"use client";

import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500"] });

export default function ClientWrapper({ children }) {
  return <div className={outfit.className}>{children}</div>;
}
