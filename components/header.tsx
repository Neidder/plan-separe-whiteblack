"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LogOut, User, Menu } from "lucide-react";
import { useState } from "react";
import { MobileSidebar } from "./mobile-sidebar";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <button
          onClick={() => setShowMobileMenu(true)}
          className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="hidden lg:block" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-card-foreground">
                {user?.nombre} {user?.apellido}
              </p>
              <p className="text-xs text-muted-foreground">{user?.correo}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar sesion</span>
          </button>
        </div>
      </header>

      <MobileSidebar
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      />
    </>
  );
}
