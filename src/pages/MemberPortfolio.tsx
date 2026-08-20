import { useEffect, useState } from "react";
import { Gavel, HandCoins, PieChart, Wallet } from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { StatCard } from "../components/StatCard";
import { formatCurrency, formatDate } from "../utils/format";
import { MemberPortfolioView, portfolioApi } from "../services/saasApi";
import { membersApi } from "../services/api";
import type { Member } from "../types";

export default function MemberPortfolio() {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [data, setData] = useState<MemberPortfolioView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}");
    } catch {
      return {} as Record<string, any>;
    }
  })();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await membersApi.getAll();
        setMembers(list);
        const preferred =
          list.find((m: any) => m.id === Number(currentUser?.memberId))?.id ?? list[0]?.id ?? null;
        setMemberId(preferred);
        if (preferred) setData(await portfolioApi.member(preferred));
      } catch {
        setError("Could not load member portfolios");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = async (id: number) => {
    setMemberId(id);
    try {
      setLoading(true);
      setData(await portfolioApi.member(id));
    } catch {
      setError("Could not load that portfolio");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Member portfolio</h1>
          <p className="text-sm text-gray-500">
            Equity, dividends, fines and loans for one member on a single page.
          </p>
        </div>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-gray-700">Member</span>
          <select
            className="field-input min-w-[14rem]"
            value={memberId ?? ""}
            onChange={(e) => pick(Number(e.target.value))}
          >
            {members.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.fullName ?? m.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!data ? (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          No member selected.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Valid savings"
              value={formatCurrency(Number(data.validSavings || 0))}
              icon={Wallet}
              subtitle={`Pool ${formatCurrency(Number(data.chamaSavingsPool || 0))}`}
            />
            <StatCard
              title="Equity share"
              value={`${Number(data.equityPercentage || 0).toFixed(2)}%`}
              icon={PieChart}
              subtitle={`Share value ${formatCurrency(Number(data.shareValue || 0))}`}
            />
            <StatCard
              title="Dividends earned"
              value={formatCurrency(Number(data.dividendsEarned || 0))}
              icon={PieChart}
              subtitle={`Paid ${formatCurrency(Number(data.dividendsPaid || 0))}`}
            />
            <StatCard
              title="Loan balance"
              value={formatCurrency(Number(data.outstandingLoanBalance || 0))}
              icon={HandCoins}
              subtitle={`${data.activeLoans} active loan(s)`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2 text-gray-900">
                <Gavel size={18} />
                <h2 className="font-semibold">Fines & penalties</h2>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Assessed", data.finesAssessed],
                  ["Paid", data.finesPaid],
                  ["Outstanding", data.finesOutstanding],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-xl bg-gray-50 p-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      {label}
                    </dt>
                    <dd className="mt-1 font-semibold text-gray-900">
                      {formatCurrency(Number(value || 0))}
                    </dd>
                  </div>
                ))}
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Count
                  </dt>
                  <dd className="mt-1 font-semibold text-gray-900">{data.finesCount}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2 text-gray-900">
                <HandCoins size={18} />
                <h2 className="font-semibold">Loans</h2>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Total borrowed", data.totalBorrowed],
                  ["Total repaid", data.totalRepaid],
                  ["Interest paid", data.interestPaid],
                  ["Outstanding", data.outstandingLoanBalance],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-xl bg-gray-50 p-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      {label}
                    </dt>
                    <dd className="mt-1 font-semibold text-gray-900">
                      {formatCurrency(Number(value || 0))}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-3">
              <h2 className="font-semibold text-gray-900">Dividend history</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Declaration</th>
                    <th className="px-5 py-3 text-right">Equity</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3">Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(data.dividendHistory ?? []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-6 text-center text-gray-400">
                        No dividends yet.
                      </td>
                    </tr>
                  )}
                  {(data.dividendHistory ?? []).map((a) => (
                    <tr key={a.id}>
                      <td className="px-5 py-3 text-gray-700">#{a.declarationId}</td>
                      <td className="px-5 py-3 text-right text-gray-600">
                        {Number(a.equityPercentage || 0).toFixed(2)}%
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(Number(a.amount || 0))}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {a.paid ? (a.paidAt ? formatDate(a.paidAt) : "Yes") : "Pending"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
