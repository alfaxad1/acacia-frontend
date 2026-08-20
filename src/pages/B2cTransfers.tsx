import React, { useState, useEffect } from "react";
import { Check, X, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { b2cTransfersApi } from "../services/api";
import { B2cTransferDto, TransactionStatus } from "../types";
import { formatCurrency, formatDate } from "../utils/format";
import { Modal } from "../components/Modal";
import { Table } from "../components/Table";

const B2cTransfers: React.FC = () => {
  const [transfers, setTransfers] = useState<B2cTransferDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState<number>(0);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [reason, setReason] = useState("");
  const [pin, setPin] = useState("");

  const currentMemberId = Number(localStorage.getItem("memberId"));
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const isAdmin = userData.role === "ADMIN";

  const fetchTransfers = async () => {
    try {
      const data = await b2cTransfersApi.getAll();
      setTransfers(data);
    } catch (error: any) {
      toast.error("Failed to fetch transfers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTransfers();
    }
  }, [isAdmin]);

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !recipientPhone || !reason || !pin) {
      return toast.error("Please fill all fields correctly");
    }

    setSubmitting(true);
    try {
      await b2cTransfersApi.initiate(amount, recipientPhone, reason, pin, currentMemberId);
      toast.success("Transfer initiated successfully");
      setIsModalOpen(false);
      setAmount(0);
      setRecipientPhone("");
      setReason("");
      setPin("");
      fetchTransfers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to initiate transfer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAuthorize = async (id: number, approve: boolean) => {
    try {
      await toast.promise(
        b2cTransfersApi.authorize(id, currentMemberId, approve),
        {
          loading: "Processing authorization...",
          success: `Transfer ${approve ? "approved" : "rejected"}!`,
          error: (err) => err?.response?.data?.message || "Authorization failed",
        }
      );
      fetchTransfers();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-500 font-bold">Unauthorized Access</div>;
  }

  const columns = [
    {
      key: "details",
      header: "Transfer Details",
      render: (item: B2cTransferDto) => (
        <div>
          <div className="font-bold text-gray-900">{formatCurrency(item.amount)}</div>
          <div className="text-sm text-gray-500">{item.recipientPhone}</div>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (item: B2cTransferDto) => (
        <span className="text-sm text-gray-700">{item.reason}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: B2cTransferDto) => {
        let color = "bg-gray-100 text-gray-800";
        if (item.status === TransactionStatus.COMPLETED || item.status === TransactionStatus.APPROVED) color = "bg-green-100 text-green-800";
        if (item.status === TransactionStatus.PENDING) color = "bg-yellow-100 text-yellow-800";
        if (item.status === TransactionStatus.FAILED || item.status === TransactionStatus.REJECTED) color = "bg-red-100 text-red-800";
        return (
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${color}`}>
            {item.status}
          </span>
        );
      },
    },
    {
      key: "initiated",
      header: "Initiated By",
      render: (item: B2cTransferDto) => (
        <div className="text-sm">
          <div>{item.initiatedByName}</div>
          <div className="text-xs text-gray-500">{formatDate(item.createdAt)}</div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: B2cTransferDto) => {
        if (item.status !== TransactionStatus.PENDING) {
          return (
            <div className="text-sm text-gray-500">
              {item.authorizedByName ? `Authorized by ${item.authorizedByName}` : "Processed"}
            </div>
          );
        }

        if (item.initiatedById === currentMemberId) {
          return <div className="text-sm text-gray-500 italic">Waiting for another admin</div>;
        }

        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleAuthorize(item.id, true)}
              className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
              title="Approve"
            >
              <Check size={18} />
            </button>
            <button
              onClick={() => handleAuthorize(item.id, false)}
              className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              title="Reject"
            >
              <X size={18} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">B2C Transfers (Paybill)</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage and authorize payouts from the paybill.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium w-full sm:w-auto"
        >
          <Plus size={20} />
          New Transfer
        </button>
      </div>

      {/* Mobile View: Cards */}
      <div className="block sm:hidden space-y-3 mb-6">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading transfers...</div>
        ) : transfers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">No transfers found.</div>
        ) : (
          transfers.map((item) => {
            let color = "bg-gray-100 text-gray-800";
            if (item.status === TransactionStatus.COMPLETED || item.status === TransactionStatus.APPROVED) color = "bg-green-100 text-green-800";
            if (item.status === TransactionStatus.PENDING) color = "bg-yellow-100 text-yellow-800";
            if (item.status === TransactionStatus.FAILED || item.status === TransactionStatus.REJECTED) color = "bg-red-100 text-red-800";

            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{formatCurrency(item.amount)}</div>
                    <div className="text-sm text-gray-500">{item.recipientPhone}</div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${color}`}>
                    {item.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded-lg">
                  <span className="font-medium text-gray-500 text-xs block mb-1">Reason</span>
                  {item.reason}
                </div>

                <div className="flex justify-between items-end border-t border-gray-100 pt-3">
                  <div className="text-xs">
                    <span className="text-gray-500 block mb-0.5">Initiated by</span>
                    <span className="font-medium text-gray-900">{item.initiatedByName}</span>
                    <span className="text-gray-400 ml-1">on {formatDate(item.createdAt)}</span>
                  </div>

                  {item.status === TransactionStatus.PENDING ? (
                    item.initiatedById === currentMemberId ? (
                      <div className="text-sm text-gray-500 italic">Waiting for another admin</div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAuthorize(item.id, true)}
                          className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => handleAuthorize(item.id, false)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="text-xs text-gray-500">
                      {item.authorizedByName ? `Authorized by ${item.authorizedByName}` : "Processed"}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading transfers...</div>
        ) : (
          <Table columns={columns} data={transfers} />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initiate B2C Transfer"
      >
        <form onSubmit={handleInitiate} className="p-1 sm:p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (KES)</label>
            <input
              type="number"
              required
              min="10"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-3 sm:py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base sm:text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Recipient Phone</label>
            <input
              type="text"
              required
              placeholder="e.g. 254712345678"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              className="w-full px-4 py-3 sm:py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base sm:text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Reason</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 sm:py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base sm:text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Your PIN / Password</label>
            <input
              type="password"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 sm:py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base sm:text-sm font-medium"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {submitting ? "Initiating..." : "Initiate"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default B2cTransfers;
