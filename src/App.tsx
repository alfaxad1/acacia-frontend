import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Members } from "./pages/Members";
import { Loans } from "./pages/Loans";
import { Contributions } from "./pages/Contributions";
import PendingLoans from "./pages/PendingLoans";
import Fines from "./pages/Fines";
import PendingDisbursement from "./pages/PendingDisbursement";
import { Toaster } from "react-hot-toast";
import Settings from "./pages/Settings";
import ExtrasPage from "./pages/ExtrasPage";

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          className:
            "text-sm font-medium rounded-xl border border-gray-100 shadow-lg",
          duration: 4000,
        }}
      />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <Layout>
                  <Members />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans"
            element={
              <ProtectedRoute>
                <Layout>
                  <Loans />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contributions"
            element={
              <ProtectedRoute>
                <Layout>
                  <Contributions />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/extras"
            element={
              <ProtectedRoute>
                <Layout>
                  <ExtrasPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pendingLoans"
            element={
              <ProtectedRoute>
                <Layout>
                  <PendingLoans />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fines"
            element={
              <ProtectedRoute>
                <Layout>
                  <Fines />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pending-disbursements"
            element={
              <ProtectedRoute>
                <Layout>
                  <PendingDisbursement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
