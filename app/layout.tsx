import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Image from 'next/image';

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
});

export const metadata: Metadata = {
    title: "Aidoptation | Autonomous Intelligence Hub",
    description: "Industry-leading news aggregation for autonomous driving and supplier technology.",
    icons: {
        icon: "/Aidoptation_Logos-01.PNG", // Temporary mapping until actual icon is set
    }
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${outfit.variable} font-sans selection:bg-primary/30`}>
                <div className="fixed inset-0 z-[-1] bg-[#0a0c10]" />
                <div className="fixed inset-0 z-[-1] bg-ambient-glow" />

                {/* Brand Watermark */}
                <div className="fixed inset-0 z-[-1] flex items-center justify-center pointer-events-none overflow-hidden">
                    <div className="relative w-[90vw] h-[90vw] opacity-[0.04] mix-blend-overlay">
                        <Image
                            src="/Aidoptation_Logos-01.PNG"
                            alt="Background Watermark"
                            fill
                            className="object-contain grayscale invert"
                            priority
                        />
                    </div>
                </div>

                {children}
            </body>
        </html>
    );
}
