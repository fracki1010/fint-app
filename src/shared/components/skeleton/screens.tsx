import { Skeleton, SkeletonCard, SkeletonChart, SkeletonKpi, SkeletonPanel, SkeletonRegion, SkeletonRow, SkeletonRowList } from "./primitives";

// One composition per screen. Each mirrors the real layout of its screen: the same
// header height, the same blocks in the same order, and the same gutters.

export function DashboardSkeleton() {
  return (
    <SkeletonRegion label="Cargando el panel">
      <div className="financial-card-accent mx-4 mt-4 rounded-[28px] p-5 lg:mx-6 lg:mt-6 lg:p-7">
        <Skeleton className="h-2.5 w-28 rounded-md" />
        <Skeleton className="mt-4 h-8 w-44 rounded-md" />
        <Skeleton className="mt-3 h-2.5 w-3/5 rounded-md" />
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </div>
      <div className="px-4 py-5 lg:px-6 lg:py-6">
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-5 lg:gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <SkeletonKpi key={i} className={i > 2 ? "hidden lg:block" : ""} />
          ))}
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:gap-5">
          <SkeletonPanel lines={4}>
            <div className="mt-4">
              <SkeletonChart height={170} />
            </div>
          </SkeletonPanel>
          <SkeletonPanel lines={5} />
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function SalesListSkeleton() {
  return (
    <SkeletonRegion label="Cargando ventas">
      <div className="px-4 pt-2 lg:px-5">
        <SkeletonRowList rows={7} lines={2} leading="tile" rowClassName="min-h-[85px] lg:min-h-0" />
      </div>
    </SkeletonRegion>
  );
}

export function SaleDetailSkeleton() {
  return (
    <SkeletonRegion label="Cargando la venta">
      <div className="space-y-4 px-4 py-4 lg:px-6">
        <Skeleton className="h-3 w-28 rounded-md" />
        <Skeleton className="h-7 w-40 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SkeletonPanel lines={2} className="p-4" />
          <SkeletonPanel lines={2} className="p-4" />
        </div>
        <SkeletonPanel lines={3} />
        <SkeletonPanel lines={2} />
      </div>
    </SkeletonRegion>
  );
}

export function NewSaleSkeleton() {
  return (
    <SkeletonRegion label="Cargando nueva venta">
      <div className="space-y-5 px-4 py-5 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0 lg:px-0">
        <div className="space-y-5 lg:col-span-8">
          <SkeletonPanel lines={1}>
            <Skeleton className="mt-4 h-12 w-full rounded-2xl" />
          </SkeletonPanel>
          <SkeletonPanel lines={1}>
            <Skeleton className="mt-4 h-12 w-full rounded-2xl" />
            <div className="mt-4">
              <SkeletonRowList rows={2} lines={2} leading="tile" />
            </div>
          </SkeletonPanel>
        </div>
        <div className="lg:col-span-4">
          <SkeletonPanel lines={4} />
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function ProductsListSkeleton() {
  return (
    <SkeletonRegion label="Cargando artículos">
      <div className="px-4 pb-28 pt-2 lg:px-5">
        <SkeletonRowList rows={8} lines={2} leading="tile" />
      </div>
    </SkeletonRegion>
  );
}

export function DetailSkeleton() {
  return (
    <SkeletonRegion label="Cargando el artículo">
      <div className="space-y-4 px-4 py-4 lg:px-6">
        <Skeleton className="h-6 w-48 rounded-md" />
        <Skeleton className="h-3 w-28 rounded-md" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonKpi />
          <SkeletonKpi />
        </div>
        <SkeletonPanel lines={3} />
        <SkeletonPanel lines={4} />
      </div>
    </SkeletonRegion>
  );
}

export function MovementsSkeleton() {
  return (
    <SkeletonRegion label="Cargando movimientos">
      <div className="px-4 pt-2 lg:px-5">
        <SkeletonRowList rows={8} lines={2} leading="circle" />
      </div>
    </SkeletonRegion>
  );
}

export function ClientsListSkeleton() {
  return (
    <SkeletonRegion label="Cargando clientes">
      <div className="px-4 pb-28 pt-2 lg:px-5">
        <SkeletonRowList rows={8} lines={2} leading="circle" />
      </div>
    </SkeletonRegion>
  );
}

export function ClientAccountSkeleton() {
  return (
    <SkeletonRegion label="Cargando cuenta corriente">
      <div className="space-y-4 px-4 py-4 lg:px-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SkeletonKpi />
          <SkeletonKpi />
          <SkeletonKpi />
          <SkeletonKpi />
        </div>
        <SkeletonRowList rows={6} lines={2} leading="circle" />
      </div>
    </SkeletonRegion>
  );
}

export function SuppliersListSkeleton() {
  return (
    <SkeletonRegion label="Cargando proveedores">
      <div className="space-y-2 px-4 pb-28 pt-2 lg:px-5">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </SkeletonRegion>
  );
}

export function PurchasesListSkeleton() {
  return (
    <SkeletonRegion label="Cargando compras">
      <div className="px-4 pb-28 pt-2 lg:px-5">
        <SkeletonRowList rows={7} lines={2} leading="tile" />
      </div>
    </SkeletonRegion>
  );
}

export function FinancialSkeleton() {
  return (
    <SkeletonRegion label="Cargando finanzas">
      <div className="space-y-4 px-4 py-4 lg:px-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SkeletonKpi />
          <SkeletonKpi />
          <SkeletonKpi />
          <SkeletonKpi />
        </div>
        <SkeletonChart height={200} />
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonPanel lines={4} />
          <SkeletonPanel lines={4} />
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function CashSkeleton() {
  return (
    <SkeletonRegion label="Cargando caja">
      <div className="space-y-4 px-4 py-4 lg:px-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <SkeletonKpi />
          <SkeletonKpi />
          <SkeletonKpi />
        </div>
        <SkeletonRowList rows={6} lines={2} leading="none" trailing />
      </div>
    </SkeletonRegion>
  );
}

export function TeamSkeleton() {
  return (
    <SkeletonRegion label="Cargando equipo">
      <div className="space-y-2 px-4 pb-28 pt-2 lg:px-5">
        {Array.from({ length: 5 }, (_, i) => (
          <SkeletonRow key={i} leading="circle" lines={2} trailing={false} className="bg-content1" />
        ))}
      </div>
    </SkeletonRegion>
  );
}

export function SettingsSkeleton() {
  return (
    <SkeletonRegion label="Cargando ajustes">
      <div className="space-y-5 px-4 py-5 lg:px-6">
        {Array.from({ length: 3 }, (_, i) => (
          <SkeletonPanel key={i} lines={0}>
            <div className="mt-4 space-y-3">
              <Skeleton className="h-12 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          </SkeletonPanel>
        ))}
      </div>
    </SkeletonRegion>
  );
}

// App shell placeholder used while the session is checked and while a route chunk loads:
// the top bar, the desktop rail, and a generic title with rows. It does not guess the screen.
export function AppShellSkeleton() {
  return (
    <SkeletonRegion label="Cargando Fint" className="flex min-h-dvh bg-background">
      <aside className="hidden w-60 shrink-0 space-y-4 border-r border-divider/20 p-5 lg:block">
        <Skeleton className="h-9 w-32 rounded-xl" />
        <div className="space-y-2 pt-4">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-xl" />
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-4 py-3 lg:hidden">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <div className="space-y-5 px-4 py-6 lg:px-6">
          <Skeleton className="h-7 w-40 rounded-md" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SkeletonKpi />
            <SkeletonKpi />
            <SkeletonKpi />
            <SkeletonKpi />
          </div>
          <SkeletonRowList rows={5} lines={2} leading="tile" />
        </div>
      </div>
    </SkeletonRegion>
  );
}
