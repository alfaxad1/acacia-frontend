import { useState, useEffect } from "react";
import {
  Save,
  Settings as SettingsIcon,
  Pencil,
  X,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { API_URL } from "../config/constant";

const Settings = () => {
  const [loading, setLoading] = useState<string | null>(null); // Track which field is saving
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    contributionDay: "MONDAY",
    contributionAmount: 0,
    daysToDeadline: 0,
    deadlineTime: "18:00",
    latePaymentFineAmount: 0,
    meetingAbsentFineAmount: 0,
    meetingLateFineAmount: 0,
    loanInterestRate: 0,
    loanPenaltyRate: 0,
    loanDuration: 12,
    status: "ACTIVE",
  });

  const url = `${API_URL}/setup`;
  const role = localStorage.getItem("role");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(url);
        if (response.data) setFormData(response.data);
      } catch (error) {
        toast.error("Failed to load settings");
      }
    };
    fetchSettings();
  }, [url]);

  const handleUpdateField = async (fieldName: string) => {
    setLoading(fieldName);
    try {
      // Your Java backend editSetups(SaccoSetups saccoSetups) expects the full object
      await axios.put(url, formData);
      toast.success(`${fieldName.replace(/([A-Z])/g, " $1")} updated!`);
      setEditingField(null);
    } catch (error) {
      toast.error("Error updating settings");
    } finally {
      setLoading(null);
    }
  };

  // Reusable Row Component for each setting
  const SettingRow = ({ label, name, type = "number", suffix = "" }: any) => {
    const isEditing = editingField === name;
    const isSaving = loading === name;

    return (
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-all">
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            {label}
          </p>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type={type}
                name={name}
                value={formData[name]}
                onChange={(e) =>
                  setFormData({ ...formData, [name]: e.target.value })
                }
                className="w-full max-w-[240px] p-2 text-sm border-2 border-blue-400 rounded-lg bg-white dark:bg-gray-800 outline-none ring-4 ring-blue-50 dark:ring-blue-900/20"
              />
              {suffix && (
                <span className="text-gray-500 text-sm">{suffix}</span>
              )}
            </div>
          ) : (
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              {type === "number"
                ? Number(formData[name]).toLocaleString()
                : formData[name]}
              <span className="text-sm font-normal text-gray-500 ml-1">
                {suffix}
              </span>
            </p>
          )}
        </div>

        {role === "ADMIN" && (<div className="flex items-center gap-2 ml-4">
          {isEditing ? (
            <>
              <button
                onClick={() => setEditingField(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
              <button
                onClick={() => handleUpdateField(name)}
                disabled={!!loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95"
              >
                {isSaving ? (
                  "..."
                ) : (
                  <>
                    <Save size={16} /> Update
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditingField(name)}
              className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-all"
            >
              <Pencil size={18} />
            </button>
          )}
        </div>)}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200 dark:shadow-none">
              <SettingsIcon size={20} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                System Settings
              </h2>
              <p className="text-xs text-gray-500 uppercase font-medium">
                Acacia Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full uppercase tracking-widest">
            <ShieldCheck size={12} /> System Active
          </div>
        </div>

        {/* Content Groups */}
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          <div className="p-4 bg-gray-50/30 dark:bg-gray-800/10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Financial Policy
          </div>
          <SettingRow
            label="Monthly Contribution"
            name="contributionAmount"
            suffix="KSH"
          />
          <SettingRow
            label="Loan Interest Rate"
            name="loanInterestRate"
            suffix="%"
          />
          <SettingRow
            label="Loan Penalty Rate"
            name="loanPenaltyRate"
            suffix="%"
          />
          <SettingRow
            label="Max Loan Duration"
            name="loanDuration"
            suffix="days"
          />

          <div className="p-4 bg-gray-50/30 dark:bg-gray-800/10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Deadlines & Timing
          </div>
          <SettingRow
            label="Contribution Day"
            name="contributionDay"
            type="text"
          />
          <SettingRow label="Deadline Time" name="deadlineTime" type="time" />

          <div className="p-4 bg-gray-50/30 dark:bg-gray-800/10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Fines & Penalties
          </div>
          <SettingRow
            label="Late Payment Fine"
            name="latePaymentFineAmount"
            suffix="KSH"
          />
          <SettingRow
            label="Meeting Absence Fine"
            name="meetingAbsentFineAmount"
            suffix="KSH"
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;
