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
  Settings,
  Coins,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Members", icon: Users, path: "/members" },
  { name: "Active Loans", icon: HandCoins, path: "/loans" },
  { name: "Pending Approval", icon: Clock8, path: "/pendingLoans" },
  {
    name: "Pending Disbursement",
    icon: Clock8,
    path: "/pending-disbursements",
  },
  { name: "Contributions", icon: Wallet, path: "/contributions" },
  { name: "Fines", icon: Gavel, path: "/fines" },
  { name: "Extras", icon: Coins, path: "/extras" }, // Changed icon to Coins
  { name: "Settings", icon: Settings, path: "/settings" },
];

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const userName = localStorage.getItem("userName");
  const userRole = localStorage.getItem("role");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Header (Top Bar) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-30 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Acacia SACCO
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar Aside */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header: Fixed at top */}
        <div className="p-6 border-b shrink-0">
          <h1 className="text-2xl font-black text-blue-600 italic">Acacia</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
            Management System
          </p>
        </div>

        {/* Navigation: This section is scrollable */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide lg:scrollbar-default">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                }`}
              >
                <Icon
                  size={20}
                  className={`${
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-blue-600"
                  }`}
                />
                <span className="font-semibold text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: Optional, stays at the bottom */}
        <div className="p-4 border-t shrink-0">
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              {userName
                ? userName.charAt(0).toUpperCase() +
                  userName.split(" ")[1].charAt(0)
                : "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-gray-900 truncate">
                {userName}
              </p>
              <p className="text-[10px] text-gray-500">
                {userRole === "ADMIN" ? "Adminstrator" : "Member"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content: lg:ml-64 matches the aside width */}
      <main className="flex-1 lg:ml-64 pt-20 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
