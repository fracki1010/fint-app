import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Navigate, Route, Routes } from "react-router-dom";

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
const ClientAccountPage = lazy(() => import("@/pages/ClientAccount"));
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

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route
          element={
            isAuthenticated ? <Navigate replace to="/" /> : <LoginPage />
          }
          path="/login"
        />

        <Route
          element={
            <ProtectedLayout>
              <MobileLayout />
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
          <Route element={<SupplierAccountPage />} path="/supplier-account" />
          <Route element={<RecipesPage />} path="/recipes" />
          <Route element={<SuppliersPage />} path="/suppliers" />
          <Route element={<TeamPage />} path="/team" />
          <Route element={<ClientAccountPage />} path="/client-account" />
          <Route element={<SettingsPage />} path="/settings" />
          <Route element={<FinancialLayout />}>
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
