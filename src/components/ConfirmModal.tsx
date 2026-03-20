interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  isDanger?: boolean;
}

const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  isDanger = false,
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">{message}</p>
        </div>

        <div className="flex border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-4 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-4 font-bold text-white transition-colors ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
