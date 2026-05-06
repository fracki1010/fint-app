import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import PlanGuard from "@shared/components/PlanGuard";

import { useAuth } from "@features/auth/hooks/useAuth";

const MobileLayout = lazy(() => import("@shared/layouts/MobileLayout"));
const FinancialLayout = lazy(() => import("@features/financial/components/FinancialLayout"));
const DashboardPage = lazy(() => import("@features/dashboard/pages/Dashboard"));
const ProductsPage = lazy(() => import("@features/products/pages/Products"));
const ClientsPage = lazy(() => import("@features/clients/pages/Clients"));
const SalesPage = lazy(() => import("@features/sales/pages/Sales"));
const MovementsPage = lazy(() => import("@features/products/pages/Movements"));
const MovementDetailPage = lazy(() => import("@features/products/pages/MovementDetail"));
const SettingsPage = lazy(() => import("@features/settings/pages/Settings"));
const NewOperationPage = lazy(() => import("@features/sales/pages/NewOperation"));
const LoginPage = lazy(() => import("@features/auth/pages/Login"));
const SuppliesPage = lazy(() => import("@features/supplies/pages/Supplies"));
const PurchasesPage = lazy(() => import("@features/purchases/pages/Purchases"));
const SupplierAccountPage = lazy(() => import("@features/purchases/pages/SupplierAccount"));
const RecipesPage = lazy(() => import("@features/recipes/pages/Recipes"));
const SuppliersPage = lazy(() => import("@features/suppliers/pages/Suppliers"));
const TeamPage = lazy(() => import("@features/team/pages/Team"));
const AdminDashboard = lazy(() => import("@features/admin/pages/AdminDashboard"));
const CompanyPage = lazy(() => import("@features/admin/pages/CompanyPage"));
const ClientAccountPage = lazy(() => import("@features/clients/pages/ClientAccount"));
const ClientAccountDetailPage = lazy(() => import("@features/clients/pages/ClientAccountDetail"));
const SupplierAccountDetailPage = lazy(() => import("@features/purchases/pages/SupplierAccountDetail"));
const QuickSalePage = lazy(() => import("@features/sales/pages/QuickSale"));
const NotFoundPage = lazy(() => import("@features/shared/pages/NotFound"));
const FinancialDashboardPage = lazy(
  () => import("@features/financial/pages/FinancialDashboard"),
);
const AccountingStatementsPage = lazy(
  () => import("@features/financial/pages/AccountingStatements"),
);
const ProductAnalysisPage = lazy(
  () => import("@features/financial/pages/ProductAnalysis"),
);
const SpeculationsProjectionsPage = lazy(
  () => import("@features/financial/pages/SpeculationsProjections"),
);
const PurchasesDashboardPage = lazy(
  () => import("@features/financial/pages/PurchasesDashboard"),
);
const SuperAdminDashboardPage = lazy(() => import("@features/superadmin/pages/SuperAdminDashboard"));
const TenantListPage = lazy(() => import("@features/superadmin/pages/TenantList"));
const TenantCreatePage = lazy(() => import("@features/superadmin/pages/TenantCreate"));
const TenantDetailPage = lazy(() => import("@features/superadmin/pages/TenantDetail"));
const AuditLogPage = lazy(() => import("@features/superadmin/pages/AuditLogPage"));

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  return <>{children}</>;
}

function SuperAdminRouteGuard() {
  const { user } = useAuth();
  if (!user?.isSuperAdmin) {
    return <Navigate replace to="/" />;
  }
  return <Outlet />;
}

function RegularRouteGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.isSuperAdmin) {
    return <Navigate replace to="/superadmin" />;
  }
  return <>{children}</>;
}

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route
          element={
            isAuthenticated
              ? user?.isSuperAdmin
                ? <Navigate replace to="/superadmin" />
                : <Navigate replace to="/" />
              : <LoginPage />
          }
          path="/login"
        />

        {/* SuperAdmin Routes — separate from the regular app */}
        <Route
          element={
            <ProtectedLayout>
              <SuperAdminRouteGuard />
            </ProtectedLayout>
          }
        >
          <Route element={<SuperAdminDashboardPage />} path="/superadmin" />
          <Route element={<TenantListPage />} path="/superadmin/tenants" />
          <Route element={<TenantCreatePage />} path="/superadmin/tenants/new" />
          <Route element={<TenantDetailPage />} path="/superadmin/tenants/:tenantId" />
          <Route element={<AuditLogPage />} path="/superadmin/audit" />
        </Route>

        {/* Regular App Routes — superadmins can't access these */}
        <Route
          element={
            <ProtectedLayout>
              <RegularRouteGuard>
                <MobileLayout />
              </RegularRouteGuard>
            </ProtectedLayout>
          }
        >
          <Route element={<DashboardPage />} path="/" />
          <Route element={<ProductsPage />} path="/products" />
          <Route element={<ProductsPage />} path="/products/:productId" />
          <Route element={<ClientsPage />} path="/clients" />
          <Route element={<ClientsPage />} path="/clients/:clientId" />
          <Route element={<SalesPage />} path="/sales" />
          <Route element={<SalesPage />} path="/sales/:orderId" />
          <Route element={<MovementsPage />} path="/movements" />
          <Route
            element={<MovementDetailPage />}
            path="/movements/:movementId"
          />
          <Route element={<QuickSalePage />} path="/quick-sale" />
          <Route element={<NewOperationPage />} path="/new-operation" />
          <Route element={<SuppliesPage />} path="/supplies" />
          <Route element={<SuppliesPage />} path="/supplies/:supplyId" />
          <Route element={<PurchasesPage />} path="/purchases" />
          <Route element={<PurchasesPage />} path="/purchases/:purchaseId" />
<Route element={<PlanGuard feature="supplier_account"><SupplierAccountPage /></PlanGuard>} path="/supplier-account" />
<Route element={<PlanGuard feature="supplier_account"><SupplierAccountDetailPage /></PlanGuard>} path="/supplier-account/:supplierId" />
<Route element={<PlanGuard feature="recipes"><RecipesPage /></PlanGuard>} path="/recipes" />
          <Route element={<SuppliersPage />} path="/suppliers" />
          <Route element={<AdminDashboard />} path="/admin" />
          <Route element={<PlanGuard feature="team_management"><TeamPage /></PlanGuard>} path="/admin/team" />
          <Route element={<CompanyPage />} path="/admin/company" />
          <Route element={<PlanGuard feature="team_management"><TeamPage /></PlanGuard>} path="/team" />
          <Route element={<PlanGuard feature="client_account"><ClientAccountPage /></PlanGuard>} path="/client-account" />
          <Route element={<PlanGuard feature="client_account"><ClientAccountDetailPage /></PlanGuard>} path="/client-account/:clientId" />
          <Route element={<SettingsPage />} path="/settings" />
          <Route element={<PlanGuard feature="financial_center"><FinancialLayout /></PlanGuard>}>
            <Route
              element={<Navigate replace to="/financial/dashboard" />}
              path="/financial"
            />
            <Route
              element={<FinancialDashboardPage />}
              path="/financial/dashboard"
            />
            <Route
              element={<AccountingStatementsPage />}
              path="/financial/accounting"
            />
            <Route
              element={<ProductAnalysisPage />}
              path="/financial/product-analysis"
            />
            <Route
              element={<SpeculationsProjectionsPage />}
              path="/financial/projections"
            />
            <Route
              element={<PurchasesDashboardPage />}
              path="/financial/purchases"
            />
          </Route>
          <Route element={<NotFoundPage />} path="*" />
        </Route>
      </Routes>
    </Suspense>
  );
}
export default App;
