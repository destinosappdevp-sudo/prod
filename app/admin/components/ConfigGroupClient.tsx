"use client";

import { useState, Suspense, lazy } from "react";
import ManualPage from "../manual/page";

const SettingsPage = lazy(() => import("../settings/page"));

interface ConfigGroupClientProps {
  initialTab?: string;
}

const TABS = [
  { key: "ajustes", label: "Ajustes" },
  { key: "manual", label: "Manual" },
];

export default function ConfigGroupClient({ initialTab }: ConfigGroupClientProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "ajustes");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-1">Ajustes de la plataforma y manual de administración</p>
        </div>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-6 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "ajustes" && (
        <Suspense fallback={<div className="text-center py-12 text-muted-foreground">Cargando configuración...</div>}>
          <SettingsPage />
        </Suspense>
      )}
      {activeTab === "manual" && <ManualPage />}
    </div>
  );
}
