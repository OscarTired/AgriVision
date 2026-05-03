import type { Metadata } from 'next';
import { Syne, Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarRail, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import Link from 'next/link';
import { ThemeProvider } from 'next-themes';
import { BookOpenText, CloudSun, Leaf, UserCircle, Moon, Sun } from 'lucide-react';
import Image from 'next/image';
import { UserBar } from '@/components/auth/UserBar';
import { ThemeToggle } from '@/components/auth/theme-toggle';

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  display: 'swap',
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AgriVision',
  description: 'Smart Farming Solutions',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${syne.variable} ${outfit.variable} antialiased font-body bg-background text-foreground transition-colors duration-normal`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SidebarProvider defaultOpen={true}>
          <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="py-3 px-3">
              <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <Image src="/agrivision.png" alt="AgriVision Logo" width={60} height={60} className="transition-transform duration-normal hover:scale-110" data-ai-hint="logo agriculture" />
                <h1 className="text-xl font-display font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden transition-opacity duration-normal">AgriVision</h1>
              </Link>
            </SidebarHeader>
            <SidebarContent className="gap-0">
              <SidebarMenu className="p-2 pt-0">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Diagnose Crop" className="btn-press transition-all duration-normal hover:translate-x-0.5">
                    <Link href="/">
                      <Leaf className="transition-all duration-normal group-hover:scale-110 group-hover:text-sidebar-primary" />
                      <span>Diagnosticar cultivo</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Weather" className="btn-press transition-all duration-normal hover:translate-x-0.5">
                    <Link href="/weather">
                      <CloudSun className="transition-all duration-normal group-hover:scale-110 group-hover:text-sidebar-primary" />
                      <span>Clima</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Base de Conocimiento" className="btn-press transition-all duration-normal hover:translate-x-0.5">
                    <Link href="/knowledge">
                      <BookOpenText className="transition-all duration-normal group-hover:scale-110 group-hover:text-sidebar-primary" />
                      <span>Conocimiento</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Perfil" className="btn-press transition-all duration-normal hover:translate-x-0.5">
                    <Link href="/profile">
                      <UserCircle className="transition-all duration-normal group-hover:scale-110 group-hover:text-sidebar-primary" />
                      <span>Perfil</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4">
              <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden animate-fade-in" style={{ animationDelay: '300ms' }}>
                <Leaf className="w-3 h-3 text-sidebar-foreground/40" />
                <p className="text-xs text-sidebar-foreground/50 font-body">© 2026 AgriVision</p>
              </div>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>
          <SidebarInset>
            <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b border-border/40 bg-background/85 backdrop-blur-xl px-4 sm:h-16 sm:px-6 transition-all duration-normal">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden btn-press" />
                <h1 className="text-xl font-display font-semibold tracking-tight animate-slide-down-fade">Dashboard</h1>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <UserBar />
      </div>
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden overflow-y-auto relative min-w-0">
              <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-30 mix-blend-screen" style={{backgroundImage: 'radial-gradient(circle at 20% 20%, hsl(var(--primary)/0.15) 0%, transparent 40%), radial-gradient(circle at 80% 80%, hsl(var(--secondary)/0.1) 0%, transparent 50%), radial-gradient(circle at 50% 100%, hsl(var(--accent)/0.1) 0%, transparent 60%)'}} />
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />
              <div className="relative page-enter">
                {children}
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
