"use client";

import { useAuth } from "@/lib/auth-context";
import {
  Users,
  ShoppingBag,
  FileText,
  CreditCard,
  TrendingUp,
  Clock,
} from "lucide-react";

const stats = [
  {
    name: "Clientes Activos",
    value: "--",
    icon: Users,
    change: "Pendiente",
  },
  {
    name: "Productos",
    value: "--",
    icon: ShoppingBag,
    change: "Pendiente",
  },
  {
    name: "Planes Activos",
    value: "--",
    icon: FileText,
    change: "Pendiente",
  },
  {
    name: "Pagos del Mes",
    value: "--",
    icon: CreditCard,
    change: "Pendiente",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold text-card-foreground">
          Bienvenido, {user?.nombre}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Este es tu panel de control. Aqui podras ver un resumen de tu negocio.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <stat.icon className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-card-foreground">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground">
          Acciones Rapidas
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Accede rapidamente a las funciones mas utilizadas
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            title="Nuevo Cliente"
            description="Registrar un nuevo cliente"
            icon={Users}
            href="/dashboard/clientes"
          />
          <QuickActionCard
            title="Nuevo Plan"
            description="Crear plan de apartado"
            icon={FileText}
            href="/dashboard/planes"
          />
          <QuickActionCard
            title="Registrar Pago"
            description="Registrar un abono"
            icon={CreditCard}
            href="/dashboard/pagos"
          />
          <QuickActionCard
            title="Ver Reportes"
            description="Estadisticas del negocio"
            icon={TrendingUp}
            href="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group flex flex-col rounded-lg border border-border bg-background p-4 transition-all hover:border-primary hover:shadow-sm"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-medium text-card-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </a>
  );
}
