import { useEffect, useState } from "react";
import { Check, Download, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaInstallButtonProps {
  className?: string;
}

function isRunningAsInstalledApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PwaInstallButton({ className = "" }: PwaInstallButtonProps) {
  const [installPrompt, setInstallPrompt] =
    useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsInstalled(isRunningAsInstalledApp());
    setIsIos(
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowInstructions(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowInstructions(true);
      return;
    }

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } catch {
      setInstallPrompt(null);
      setShowInstructions(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        disabled={isInstalled}
        className={className || "btn-secondary w-full"}
      >
        {isInstalled ? <Check size={18} /> : <Download size={18} />}
        {isInstalled ? "App installed" : "Download the app"}
      </button>

      {showInstructions && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 p-4"
          onClick={() => setShowInstructions(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="pwa-install-title"
                className="text-lg font-bold text-gray-900"
              >
                Add Chama Konnect to your device
              </h2>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                aria-label="Close install instructions"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {isIos
                ? "In Safari, tap Share, then choose “Add to Home Screen”."
                : "Open your browser menu and choose “Install app” or “Add to Home screen”."}
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              If you don’t see that option, open this page in Safari or Chrome.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
