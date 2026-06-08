import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Footer from "@/components/shared/Footer";
import ThemeToggle from "@/components/shared/ThemeToggle";
import LanguageToggle from "@/components/shared/LanguageToggle";
import ProfileMenu from "@/components/shared/ProfileMenu";
import LogoLink from "@/components/shared/LogoLink";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

export const metadata = {
  title: "NovaCampus",
  description: "NovaCampus Alliance - Higher Education Platform. Secure access for students, teachers, and staff.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              {/* Global header bar: logo (top-left) + language/theme/profile (top-right).
                  Fixed overlay with side margins. Content area gets top padding to avoid overlap. */}
              <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between bg-transparent">
                <LogoLink />
                <div className="flex items-center gap-3">
                  <LanguageToggle />
                  <ThemeToggle />
                  <ProfileMenu />
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0 pt-14">
                {children}
              </div>
              <Footer />
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
