import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UpdateRequiredCard from "@shared/components/UpdateRequiredCard";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";

import { AuthProvider } from "@features/auth/components/AuthProvider";
import "@/styles/globals.css";
import { initCapacitor } from "@shared/utils/capacitor";

initCapacitor();

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Provider>
            <App />
            <UpdateRequiredCard />
          </Provider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
