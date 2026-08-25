import { useState } from "react";
import { Table } from "../components/Table";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { useApi } from "../hooks/useApi";
import { ledgerApi, contributionsApi } from "../services/api";
import { formatCurrency } from "../utils/format";
import toast from "react-hot-toast";
import { Play } from "lucide-react";
import type { LedgerAccountDto, Role } from "../types";

export function LedgerAccounts() {
  const role: Role = (localStorage.getItem("role") as Role) || "MEMBER";
  const isAdminOrTreasurer = role === "ADMIN" || role === "TREASURER"; // TREASURER isn't in Role enum by default, but checking just in case

  const [isTriggering, setIsTriggering] = useState(false);

  const {
    data: accounts = [],
    loading,
    error,
    refetch,
  } = useApi<LedgerAccountDto[]>(async () => {
    const res = await ledgerApi.getAccounts();
    return { data: res };
  });

  const handleTriggerLifecycle = async () => {
    try {
      setIsTriggering(true);
      await contributionsApi.triggerLifecycle();
      toast.success("Lifecycle worker triggered successfully!");
      // Optionally refetch accounts if we expect balances to change
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to trigger worker");
    } finally {
      setIsTriggering(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  const columns = [
    { key: "code", header: "Code", render: (row: LedgerAccountDto) => row.code },
    { key: "name", header: "Name", render: (row: LedgerAccountDto) => row.name },
    { key: "type", header: "Type", render: (row: LedgerAccountDto) => row.type },
    { key: "fund", header: "Fund", render: (row: LedgerAccountDto) => row.fund },
    {
      key: "balance",
      header: "Balance",
      render: (row: LedgerAccountDto) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(row.balance)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Ledger Accounts</h1>
          <p className="text-gray-500 mt-1">
            Double-entry chart of accounts and real-time balances.
          </p>
        </div>
        {isAdminOrTreasurer && (
          <button
            onClick={handleTriggerLifecycle}
            disabled={isTriggering}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 focus:ring-4 focus:ring-emerald-700/20 disabled:opacity-50 transition-colors"
          >
            {isTriggering ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            Trigger Lifecycle Worker
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table data={accounts} columns={columns} />
        {accounts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No ledger accounts found.
          </div>
        )}
      </div>
    </div>
  );
}
