import { Geist, Geist_Mono } from "next/font/google";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              {/* Fixed header bar (floating style) */}
              <div className="fixed top-0 left-0 right-0 px-3 py-3 z-50 flex items-center justify-between bg-[var(--header-background)] lg:bg-transparent lg:style={{ backdropFilter: 'blur(5px)' }}">
                <LogoLink />
                <div className="flex items-center gap-3">
                  <LanguageToggle />
                  <ThemeToggle />
                  <ProfileMenu />
                </div>
              </div>

              {/* Main content area — flex-1 fills remaining viewport height */}
              <div className="flex-1 flex flex-col min-h-0">
                {children}
              </div>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}