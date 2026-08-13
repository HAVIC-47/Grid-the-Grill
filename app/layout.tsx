import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Titillium_Web } from "next/font/google";
import "./globals.css";

const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const titillium = Titillium_Web({
  variable: "--font-titillium",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Grid the Grill | F1 Driver Trait Board",
  description:
    "Mark the traits, complete the lines, chase the chequered flag. An interactive Formula 1 bingo board.",
};

export const viewport: Viewport = {
  themeColor: "#06070a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: privacy/AV browser extensions (Bitdefender's
    // bis_register, bis_skin_checked, …) stamp attributes onto html/body before
    // React hydrates, which React otherwise reports as a mismatch.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${chakra.variable} ${titillium.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="track-bg flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
