import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

const MobileLayout = lazy(() => import("@/layouts/MobileLayout"));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));
const ProductsPage = lazy(() => import("@/pages/Products"));
const ClientsPage = lazy(() => import("@/pages/Clients"));
const SalesPage = lazy(() => import("@/pages/Sales"));
const MovementsPage = lazy(() => import("@/pages/Movements"));
const MovementDetailPage = lazy(() => import("@/pages/MovementDetail"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const NewOperationPage = lazy(() => import("@/pages/NewOperation"));
const LoginPage = lazy(() => import("@/pages/Login"));
const NotFoundPage = lazy(() => import("@/pages/NotFound"));

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
          <Route element={<NewOperationPage />} path="/new-operation" />
          <Route element={<SettingsPage />} path="/settings" />
          <Route element={<NotFoundPage />} path="*" />
        </Route>
      </Routes>
    </Suspense>
  );
}
export default App;
