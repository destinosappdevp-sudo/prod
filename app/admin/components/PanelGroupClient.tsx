"use client";

import { useState } from "react";
import BannersClient from "../banners/BannersClient";

interface PanelGroupClientProps {
  initialTab?: string;
  userRole?: string;
  userId?: string;
  dashboardContent: React.ReactNode;
}

export default function PanelGroupClient({
  initialTab,
  userRole,
  userId,
  dashboardContent,
}: PanelGroupClientProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "dashboard");
  const isSuperadmin = userRole === "SUPERADMIN";

  return (
    <div className="space-y-6">
      <div className="border-b border-border">
        <nav className="flex gap-6 -mb-px">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "dashboard"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Dashboard
          </button>
          {isSuperadmin && (
            <button
              type="button"
              onClick={() => setActiveTab("publicidad")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "publicidad"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Publicidad
            </button>
          )}
        </nav>
      </div>

      {activeTab === "dashboard" && dashboardContent}
      {activeTab === "publicidad" && userId && <BannersClient userId={userId} />}
    </div>
  );
}
