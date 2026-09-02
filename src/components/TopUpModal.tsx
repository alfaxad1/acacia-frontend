import React, { useState } from "react";
import { Modal } from "./Modal";
import toast from "react-hot-toast";
import { API_URL } from "../config/constant";
import { GripVertical } from "lucide-react";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: number;
  phone: string;
}

export function TopUpModal({
  isOpen,
  onClose,
  memberId,
  phone,
}: TopUpModalProps) {
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allocationOrder, setAllocationOrder] = useState<string[]>([
    "CONTRIBUTIONS",
    "FINES",
    "LOANS",
  ]);

  const moveItem = (index: number, direction: "up" | "down") => {
    const newOrder = [...allocationOrder];
    if (direction === "up" && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [
        newOrder[index],
        newOrder[index - 1],
      ];
    } else if (direction === "down" && index < newOrder.length - 1) {
      [newOrder[index + 1], newOrder[index]] = [
        newOrder[index],
        newOrder[index + 1],
      ];
    }
    setAllocationOrder(newOrder);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0)
      return toast.error("Enter a valid amount");

    setIsSubmitting(true);
    const loadingToast = toast.loading("Initiating STK Push...");

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/chama/payments/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId,
          phone,
          amount: Number(amount),
          allocationOrder,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to initiate top up");

      toast.success(
        data.message || "STK Push sent. Please check your phone.",
        { id: loadingToast }
      );
      onClose();
      setAmount("");
    } catch (err: any) {
      toast.error(err.message || "Error processing top up", {
        id: loadingToast,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Top Up">
      <form onSubmit={handleSubmit} className="p-2 sm:p-4 space-y-6">
        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">
            Dynamic Top Up
          </p>
          <p className="text-xs text-indigo-700 font-medium leading-relaxed">
            Specify the amount to pay, and choose the order in which your balances
            should be settled. Any remaining amount will automatically be deposited
            into your Surplus.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Amount (Ksh)
          </label>
          <input
            type="number"
            required
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-indigo-500 focus:bg-white font-bold text-base transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Settlement Priority Order
          </label>
          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            {allocationOrder.map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between p-3 border-b border-gray-200 last:border-b-0 bg-white"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 capitalize">
                    {item.toLowerCase()}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveItem(index, "up")}
                    className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={index === allocationOrder.length - 1}
                    onClick={() => moveItem(index, "down")}
                    className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 ml-1 mt-2">
            Tip: The system settles the oldest records first within each category.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Processing..." : `Pay Ksh ${amount || "0"}`}
        </button>
      </form>
    </Modal>
  );
}
