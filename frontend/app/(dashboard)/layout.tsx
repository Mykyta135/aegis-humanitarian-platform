"use client";
import AuthWrapper from "@/components/auth/AuthWrapper";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/use-auth.store";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuthStore();

  return (
    <AuthWrapper>
      <header className="border-b bg-background h-16 sticky top-0 z-10">
        <div className="container mx-auto flex h-full items-center justify-between">
          <div className="font-bold">Aegis Platform</div>
          <nav className="flex items-center gap-4">
            <Link href="/" passHref>
              <Button variant="ghost">Dashboard</Button>
            </Link>

            <Link href="/map" passHref>
              <Button variant="ghost">Map</Button>
            </Link>

            {user?.role === "admin" && (
              <Link href="/manage" passHref>
                <Button variant="ghost">Manage</Button>
              </Link>
            )}
            <NotificationCenter />
            <Link href="/profile" passHref>
              <Button variant="ghost">{user?.email?.split("@")[0] ?? "Profile"}</Button>
            </Link>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </nav>
        </div>
      </header>
      <main className="bg-muted/40">{children}</main>
    </AuthWrapper>
  );
}
