import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Menu,
  X,
  Clock8,
  Gavel,
  HandCoins,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Members", icon: Users, path: "/members" },
  { name: "Loans", icon: HandCoins, path: "/loans" },
  { name: "Pending Loans", icon: Clock8, path: "/pendingLoans" },
  { name: "Contributions", icon: Wallet, path: "/contributions" },
  { name: "Fines", icon: Gavel, path: "/fines" },
];

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-30 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Acacia SACCO</h1>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">Acacia SACCO</h1>
          <p className="text-sm text-gray-500 mt-1">Management System</p>
        </div>
        <nav className="p-4 space-y-2">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path; 

        return (
          <Link
            key={item.name}
            to={item.path} 
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Icon size={20} />
            <span className="font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
      </aside>

      <main className="lg:ml-64 pt-20 lg:pt-0 p-6">{children}</main>
    </div>
  );
}
