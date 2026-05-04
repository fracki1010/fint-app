import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import PlanGuard from "@/components/PlanGuard";

import { useAuth } from "@/hooks/useAuth";

const MobileLayout = lazy(() => import("@/layouts/MobileLayout"));
const FinancialLayout = lazy(() => import("@/layouts/FinancialLayout"));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));
const ProductsPage = lazy(() => import("@/pages/Products"));
const ClientsPage = lazy(() => import("@/pages/Clients"));
const SalesPage = lazy(() => import("@/pages/Sales"));
const MovementsPage = lazy(() => import("@/pages/Movements"));
const MovementDetailPage = lazy(() => import("@/pages/MovementDetail"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const NewOperationPage = lazy(() => import("@/pages/NewOperation"));
const LoginPage = lazy(() => import("@/pages/Login"));
const SuppliesPage = lazy(() => import("@/pages/Supplies"));
const PurchasesPage = lazy(() => import("@/pages/Purchases"));
const SupplierAccountPage = lazy(() => import("@/pages/SupplierAccount"));
const RecipesPage = lazy(() => import("@/pages/Recipes"));
const SuppliersPage = lazy(() => import("@/pages/Suppliers"));
const TeamPage = lazy(() => import("@/pages/Team"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const CompanyPage = lazy(() => import("@/pages/admin/CompanyPage"));
const ClientAccountPage = lazy(() => import("@/pages/ClientAccount"));
const ClientAccountDetailPage = lazy(() => import("@/pages/ClientAccountDetail"));
const SupplierAccountDetailPage = lazy(() => import("@/pages/SupplierAccountDetail"));
const QuickSalePage = lazy(() => import("@/pages/QuickSale"));
const NotFoundPage = lazy(() => import("@/pages/NotFound"));
const FinancialDashboardPage = lazy(
  () => import("@/pages/financial/FinancialDashboard"),
);
const AccountingStatementsPage = lazy(
  () => import("@/pages/financial/AccountingStatements"),
);
const ProductAnalysisPage = lazy(
  () => import("@/pages/financial/ProductAnalysis"),
);
const SpeculationsProjectionsPage = lazy(
  () => import("@/pages/financial/SpeculationsProjections"),
);
const PurchasesDashboardPage = lazy(
  () => import("@/pages/financial/PurchasesDashboard"),
);
const SuperAdminDashboardPage = lazy(() => import("@/pages/superadmin/SuperAdminDashboard"));
const TenantListPage = lazy(() => import("@/pages/superadmin/TenantList"));
const TenantCreatePage = lazy(() => import("@/pages/superadmin/TenantCreate"));
const TenantDetailPage = lazy(() => import("@/pages/superadmin/TenantDetail"));
const AuditLogPage = lazy(() => import("@/pages/superadmin/AuditLogPage"));

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
