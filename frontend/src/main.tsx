import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext.js";
import { ProtectedRoute, RoleRoute } from "./components/ProtectedRoute.js";
import { Layout } from "./components/Layout.js";
import { LoginPage } from "./pages/LoginPage.js";
import { Toaster } from "sonner";
import "./index.css";

import { StudentsPage } from "./pages/StudentsPage.js";
import { ManageStaffPage } from "./pages/ManageStaffPage.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Guarded Application Shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {/* Default route: Student list */}
                <Route path="/" element={<StudentsPage />} />
                
                <Route element={<RoleRoute allowedRoles={["PRINCIPAL"]} />}>
                  <Route path="/users" element={<ManageStaffPage />} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all redirect to index */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        
        {/* Modern toast popup container */}
        <Toaster theme="dark" position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
