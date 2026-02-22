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

function App() {
  return (
    <BrowserRouter>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
