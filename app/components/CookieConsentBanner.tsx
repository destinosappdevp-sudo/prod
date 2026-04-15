"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const COOKIE_NAME = "destinos_cookie_consent";
const ONE_YEAR = 60 * 60 * 24 * 365;

type CookiePreferences = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
};

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

function readConsentCookie(): CookiePreferences | null {
  if (typeof document === "undefined") return null;

  const raw = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!raw) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return {
      essential: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
    };
  } catch {
    return null;
  }
}

function writeConsentCookie(preferences: CookiePreferences) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(preferences)
  )}; max-age=${ONE_YEAR}; path=/; SameSite=Lax`;
}

interface CookieConsentBannerProps {
  isLoggedIn?: boolean;
}

export default function CookieConsentBanner({ isLoggedIn = false }: CookieConsentBannerProps) {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const saved = readConsentCookie();
    if (!saved) {
      setVisible(true);
      return;
    }

    setPreferences(saved);
    setVisible(false);
  }, []);

  const bottomOffset = useMemo(() => {
    return isLoggedIn ? "bottom-20" : "bottom-4";
  }, [isLoggedIn]);

  const savePreferences = (nextPreferences: CookiePreferences) => {
    writeConsentCookie(nextPreferences);
    setPreferences(nextPreferences);
    setVisible(false);
    setShowPreferences(false);
  };

  if (!visible) return null;

  return (
    <div className={`fixed left-0 right-0 z-[80] ${bottomOffset} px-3 sm:px-4`}>
      <div className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-[#090828] px-4 py-4 text-white shadow-2xl sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-5xl">
            <p className="text-sm leading-6 text-white/95 sm:text-base">
              Este sitio web utiliza tecnologías como cookies para habilitar la funcionalidad esencial del sitio,
              así como para analítica, personalización y publicidad dirigida. Puedes cambiar la configuración en
              cualquier momento, o aceptar la configuración predeterminada. Puede cerrar este banner para continuar
              con solo las cookies esenciales.
            </p>
            <Link href="/privacidad" className="mt-1 inline-block text-sm font-medium text-white underline underline-offset-2">
              Política de privacidad
            </Link>

            {showPreferences && (
              <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
                <label className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">Esenciales</span>
                    <input type="checkbox" checked disabled className="h-4 w-4 accent-[#E0AE33]" />
                  </div>
                  <p className="mt-1 text-xs text-white/70">Necesarias para autenticación y funcionamiento básico.</p>
                </label>

                <label className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">Analítica</span>
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(event) =>
                        setPreferences((current) => ({ ...current, analytics: event.target.checked }))
                      }
                      className="h-4 w-4 accent-[#E0AE33]"
                    />
                  </div>
                  <p className="mt-1 text-xs text-white/70">Ayuda a entender el uso del sitio para mejorarlo.</p>
                </label>

                <label className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">Personalización</span>
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(event) =>
                        setPreferences((current) => ({ ...current, marketing: event.target.checked }))
                      }
                      className="h-4 w-4 accent-[#E0AE33]"
                    />
                  </div>
                  <p className="mt-1 text-xs text-white/70">Permite recordar preferencias y contenido relevante.</p>
                </label>

                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={() => savePreferences(preferences)}
                    className="rounded-xl bg-[#E0AE33] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c99723]"
                  >
                    Guardar preferencias
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex w-full flex-col gap-2 lg:w-[300px]">
            <button
              type="button"
              onClick={() => setShowPreferences((current) => !current)}
              className="rounded-xl bg-[#5d4d87] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6b589a]"
            >
              Administrar preferencias
            </button>
            <button
              type="button"
              onClick={() => savePreferences({ essential: true, analytics: true, marketing: true })}
              className="rounded-xl bg-[#5d4d87] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6b589a]"
            >
              Aceptar todo
            </button>
            <button
              type="button"
              onClick={() => savePreferences({ essential: true, analytics: false, marketing: false })}
              className="rounded-xl bg-[#5d4d87] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6b589a]"
            >
              Rechazar lo no esencial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
