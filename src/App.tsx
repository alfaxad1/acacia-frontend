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

import { Toaster } from "react-hot-toast";
import ExtrasPage from "./pages/ExtrasPage";
import ContributionArrears from "./pages/ContributionArrears";
import AdjustmentDashboard from "./pages/AdjustmentManager";
import B2cTransfers from "./pages/B2cTransfers";
import Meetings from "./pages/Meetings";
import RegisterChama from "./pages/RegisterChama";
import MpesaSetup from "./pages/MpesaSetup";
import Welfare from "./pages/Welfare";
import MerryGoRound from "./pages/MerryGoRound";
import Invites from "./pages/Invites";
import AcceptInvite from "./pages/AcceptInvite";
import ChamaSettings from "./pages/ChamaSettings";
import Investments from "./pages/Investments";
import Dividends from "./pages/Dividends";
import MemberPortfolio from "./pages/MemberPortfolio";
import CashFlow from "./pages/CashFlow";

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
          <Route path="/register-chama" element={<RegisterChama />} />
          <Route path="/join/:token" element={<AcceptInvite />} />
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
            path="/cash-flow"
            element={
              <ProtectedRoute>
                <Layout>
                  <CashFlow />
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
                  <ChamaSettings />
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
            path="/contribution-arrears"
            element={
              <ProtectedRoute>
                <Layout>
                  <ContributionArrears />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/account-adjustments"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdjustmentDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/b2c-transfers"
            element={
              <ProtectedRoute>
                <Layout>
                  <B2cTransfers />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/meetings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Meetings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/welfare"
            element={
              <ProtectedRoute>
                <Layout>
                  <Welfare />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merry-go-round"
            element={
              <ProtectedRoute>
                <Layout>
                  <MerryGoRound />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mpesa-setup"
            element={
              <ProtectedRoute>
                <Layout>
                  <MpesaSetup />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invites"
            element={
              <ProtectedRoute>
                <Layout>
                  <Invites />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chama-setup"
            element={
              <ProtectedRoute>
                <Layout>
                  <ChamaSettings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/investments"
            element={
              <ProtectedRoute>
                <Layout>
                  <Investments />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dividends"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dividends />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute>
                <Layout>
                  <MemberPortfolio />
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
