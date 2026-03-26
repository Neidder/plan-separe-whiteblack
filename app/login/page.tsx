"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LoginForm } from "@/components/login-form";
import { Package } from "lucide-react";

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <main className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-semibold text-primary-foreground">
            Plan Separe
          </span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight text-primary-foreground text-balance">
            Sistema de Gestion de Apartados
          </h1>
          <p className="text-lg text-primary-foreground/80 leading-relaxed">
            Administra tus planes de apartado, clientes, productos y pagos de
            manera eficiente y organizada.
          </p>
        </div>

        <p className="text-sm text-primary-foreground/60">
          2024 Plan Separe. Todos los derechos reservados.
        </p>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">
              Plan Separe
            </span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">
              Bienvenido de nuevo
            </h2>
            <p className="mt-2 text-muted-foreground">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
