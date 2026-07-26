"use client";

import { useState } from "react";
import { DestinationsClient } from "./DestinationsClient";
import { PasadasClient } from "../pasadas/client";
import CategoriesClient from "../categories/CategoriesClient";
import AmenityManagerClient from "./AmenityManagerClient";

interface DestinosGroupClientProps {
  initialTab?: string;
  destinations: any[];
  pasadasPackages: any[];
  initialCategories: any[];
  amenityCategories: any[];
}

const TABS = [
  { key: "actuales", label: "Destinos actuales" },
  { key: "pasados", label: "Pasados" },
  { key: "categorias", label: "Categorías" },
  { key: "servicios", label: "Servicios" },
];

export default function DestinosGroupClient({
  initialTab,
  destinations,
  pasadasPackages,
  initialCategories,
  amenityCategories,
}: DestinosGroupClientProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "actuales");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Destinos</h1>
          <p className="text-muted-foreground mt-1">Administra destinos, pasadas, categorías y servicios</p>
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

      {activeTab === "actuales" && <DestinationsClient destinations={destinations} />}
      {activeTab === "pasados" && <PasadasClient packages={pasadasPackages} />}
      {activeTab === "categorias" && <CategoriesClient initialCategories={initialCategories} />}
      {activeTab === "servicios" && <AmenityManagerClient initialCategories={amenityCategories} />}
    </div>
  );
}
