"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, PlusCircle, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void> | void;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "pwa-install-dismissed-v1";

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iphone|ipad|ipod/i.test(ua);
}

export default function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isIos, setIsIos] = useState(false);

  const shouldOfferIosInstructions = useMemo(
    () => isMobile && isIos && !installed,
    [installed, isIos, isMobile]
  );

  useEffect(() => {
    const refreshViewportFlags = () => {
      setIsMobile(isMobileViewport());
      setIsIos(isIosDevice());
    };

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setPromptEvent(null);
    };

    refreshViewportFlags();

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener("resize", refreshViewportFlags);

    if (navigator.serviceWorker) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("resize", refreshViewportFlags);
    };
  }, []);

  useEffect(() => {
    if (!isMobile || installed) {
      setVisible(false);
      return;
    }

    const dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    if (dismissed) {
      setVisible(false);
      return;
    }

    if (promptEvent || shouldOfferIosInstructions) {
      setVisible(true);
    }
  }, [installed, isMobile, promptEvent, shouldOfferIosInstructions]);

  const handleInstall = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
        setInstalled(true);
        setPromptEvent(null);
        return;
      }
    }

    setVisible(false);
    window.localStorage.setItem(DISMISS_KEY, "1");
  };

  const handleDismiss = () => {
    setVisible(false);
    window.localStorage.setItem(DISMISS_KEY, "1");
  };

  if (!visible || !isMobile || installed) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[80] mx-auto max-w-md rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <PlusCircle size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Instala Destinos Venezuela</p>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            {shouldOfferIosInstructions
              ? "En iPhone puedes agregarlo desde Compartir > Agregar a pantalla de inicio."
              : "¿Quieres agregar un acceso directo al escritorio para abrirlo como app?"}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Download size={16} />
              Instalar
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar"
          className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
