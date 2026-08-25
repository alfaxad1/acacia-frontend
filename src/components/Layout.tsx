import { ReactNode, useEffect, useMemo, useState } from "react";
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
  CreditCard,
  CalendarDays,
  HeartHandshake,
  Repeat,
  Smartphone,
  SlidersHorizontal,
  MailPlus,
  LogOut,
  Building2,
  PieChart,
  BarChart3,
  ArrowLeftRight,
  BookOpen,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  icon: typeof Wallet;
  path: string;
  adminOnly?: boolean;
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, path: "/" },
      { name: "Members", icon: Users, path: "/members" },
      { name: "My portfolio", icon: PieChart, path: "/portfolio" },
      { name: "Money in & out", icon: ArrowLeftRight, path: "/cash-flow" },
      { name: "Ledger Accounts", icon: BookOpen, path: "/ledger", adminOnly: true },
    ],
  },
  {
    label: "Money in",
    items: [
      { name: "Contributions", icon: Wallet, path: "/contributions" },
      { name: "Missed contributions", icon: Clock8, path: "/contribution-arrears" },
      { name: "Fines", icon: Gavel, path: "/fines" },
      { name: "Extras", icon: Coins, path: "/extras" },
    ],
  },
  {
    label: "Money out",
    items: [
      { name: "Loans", icon: HandCoins, path: "/loans" },
      { name: "Pending approval", icon: Clock8, path: "/pendingLoans" },
      { name: "Merry-go-round", icon: Repeat, path: "/merry-go-round" },
      { name: "Welfare", icon: HeartHandshake, path: "/welfare" },
      { name: "B2C transfers", icon: CreditCard, path: "/b2c-transfers", adminOnly: true },
    ],
  },
  {
    label: "Grow the money",
    items: [
      { name: "Investments", icon: Building2, path: "/investments" },
      { name: "Dividends", icon: BarChart3, path: "/dividends" },
    ],
  },
  {
    label: "Run the chama",
    items: [
      { name: "Meetings", icon: CalendarDays, path: "/meetings" },
      { name: "Invite members", icon: MailPlus, path: "/invites", adminOnly: true },
      { name: "Payment gateway", icon: Smartphone, path: "/payment-gateway", adminOnly: true },
      { name: "Debits & credits", icon: CreditCard, path: "/account-adjustments", adminOnly: true },
      { name: "Settings", icon: Settings, path: "/settings", adminOnly: true },
    ],
  },
];

function initials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const userData = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}");
    } catch {
      return {} as Record<string, string>;
    }
  }, []);

  const activeChamaName = localStorage.getItem("activeChamaName") || "Chama Connect";

  const isAdmin = userData.role === "ADMIN";

  const currentTitle =
    navGroups
      .flatMap((g) => g.items)
      .find((item) => item.path === location.pathname)?.name ?? "Dashboard";

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="shrink-0 rounded-xl p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-gray-900">
              {currentTitle}
            </p>
            <p className="truncate text-[11px] uppercase tracking-[0.18em] text-gray-400">
              {activeChamaName}
            </p>
          </div>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {initials(userData.name)}
          </div>
        </div>
      </header>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-gray-950/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[17rem] max-w-[85vw] flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-5">
          <div className="min-w-0">
            <p className="font-display text-xl font-extrabold text-brand-700 truncate">{activeChamaName}</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">
              Chama workspace
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden self-start mt-1"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="scrollbar-hide flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => {
            const items = group.items.filter((item) => !item.adminOnly || isAdmin);
            if (items.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-brand-600 text-white shadow-lift"
                            : "text-gray-600 hover:bg-brand-50 hover:text-brand-800"
                        }`}
                      >
                        <Icon size={18} className="shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {initials(userData.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-gray-900">
                {userData.name || "Member"}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">
                {isAdmin ? "Administrator" : "Member"}
              </p>
            </div>
            <button
              onClick={signOut}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white hover:text-red-600"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:pl-[17rem]">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          {/* No transform here: it would make this div the containing block
              for every `position: fixed` modal rendered by a page. */}
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
}
