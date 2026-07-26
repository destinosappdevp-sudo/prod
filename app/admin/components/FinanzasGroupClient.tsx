"use client";

import React, { useState, Suspense } from "react";
import FinanzasClient from "../payments/FinanzasClient";
import ReportsPageContent from "./ReportsPageContent";

interface FinanzasGroupClientProps {
  initialTab?: string;
  userRole?: string;
  movements: any[];
  stats: any;
  savingsData: any;
  notificaciones: any[];
  withdrawals: any[];
}

const TABS = [
  { key: "pagos", label: "Pagos" },
  { key: "alcancia", label: "Alcancía" },
  { key: "r4", label: "R4" },
  { key: "retiros", label: "Retiros" },
  { key: "informes", label: "Informes" },
];

export default function FinanzasGroupClient({
  initialTab,
  movements,
  stats,
  savingsData,
  notificaciones,
  withdrawals,
}: FinanzasGroupClientProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "pagos");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Finanzas</h1>
          <p className="text-muted-foreground mt-1">Pagos, alcancías, R4, retiros e informes</p>
        </div>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-6 -mb-px overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap pb-3 text-sm font-medium border-b-2 transition-colors ${
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

      {activeTab === "pagos" && <FinanzasTabContent stats={stats} movements={movements} />}
      {activeTab === "alcancia" && <SavingsTabContent data={savingsData} />}
      {activeTab === "r4" && <R4TabContent notificaciones={notificaciones} />}
      {activeTab === "retiros" && <WithdrawalsTabContent withdrawals={withdrawals} />}
      {activeTab === "informes" && <ReportsPageContent />}
    </div>
  );
}

function FinanzasTabContent({ stats, movements }: { stats: any; movements: any[] }) {
  return (
    <div className="space-y-6">
      {stats.pendingApprovalPayments > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Tienes <span className="font-bold">{stats.pendingApprovalPayments}</span> pago(s) pendiente(s) de confirmación.
              </p>
            </div>
          </div>
        </div>
      )}
      <FinanzasClient movements={movements} />
    </div>
  );
}

function SavingsTabContent({ data }: { data: any }) {
  const AddSavingDialog = React.lazy(() => import("../savings/AddSavingDialog"));
  const SavingActions = React.lazy(() => import("../users/[userId]/savings/SavingActions"));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pendiente (USD)</p>
          <p className="text-2xl font-bold text-foreground">${data.pendingUsd.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Aprobado (USD)</p>
          <p className="text-2xl font-bold text-green-600">${data.approvedUsd.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total registros</p>
          <p className="text-2xl font-bold text-foreground">{data.totalCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Usuarios</p>
          <p className="text-2xl font-bold text-foreground">{data.users.length}</p>
        </div>
      </div>
      <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Cargando...</div>}>
        <AddSavingDialog users={data.users} homes={data.homes} walletBalances={data.walletBalances || []} />
      </Suspense>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Destino</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">USD</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Bs</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data.savings as any[]).map((s: any) => {
                const details = s.paymentDetails && typeof s.paymentDetails === "object" ? s.paymentDetails as Record<string, any> : {};
                const targetTitle = data.homeTitleById?.[s.targetId] || (typeof details.homeTitle === "string" ? details.homeTitle : "—");
                return (
                  <tr key={s.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      {new Date(s.date || s.createdAt).toLocaleDateString("es-VE")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-foreground">{s.User?.firstName || "—"}</div>
                      <div className="text-xs text-muted-foreground">{s.User?.email || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{targetTitle}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">${Number(s.amountUsd ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">Bs {Number(s.amountBs ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        s.status === "APPROVED" ? "bg-green-100 text-green-700"
                        : s.status === "PENDING" ? "bg-yellow-100 text-yellow-700"
                        : s.status === "REJECTED" ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                      }`}>
                        {s.status === "APPROVED" ? "Aprobado" : s.status === "PENDING" ? "Pendiente" : s.status === "REJECTED" ? "Rechazado" : s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Suspense fallback={<span className="text-xs text-muted-foreground">...</span>}>
                        {s.status === "PENDING" && <SavingActions savingId={s.id} currentStatus={s.status} />}
                      </Suspense>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function R4TabContent({ notificaciones }: { notificaciones: any[] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Referencia</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Banco emisor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Monto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Teléfono</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">CI / RIF</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estatus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {notificaciones.map((n: any) => (
              <tr key={n.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                  {new Date(n.createdAt).toLocaleString("es-VE")}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-foreground">{n.referencia || "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{n.bancoEmisor || "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">Bs {Number(n.monto || 0).toFixed(2)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{n.telefono || "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{n.cedulaRif || "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    n.estatus === "EXITOSA" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {n.estatus || "Pendiente"}
                  </span>
                </td>
              </tr>
            ))}
            {notificaciones.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No hay notificaciones</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WithdrawalsTabContent({ withdrawals }: { withdrawals: any[] }) {
  const WithdrawalActions = React.lazy(() => import("../withdrawals/WithdrawalActions"));

  if (withdrawals.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No hay retiros pendientes</div>;
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Host</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Método</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Monto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Banco</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Cédula</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Teléfono</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {withdrawals.map((w: any) => {
              const details = (w.paymentDetails && typeof w.paymentDetails === "object" ? w.paymentDetails : {}) as Record<string, unknown>;
              const currency = details.currency === "VES" ? "VES" : "USD";
              const prefix = currency === "VES" ? "Bs " : "$";
              return (
                <tr key={w.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                    {new Date(w.createdAt).toLocaleString("es-VE")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-foreground">{w.User?.firstName || "—"}</div>
                    <div className="text-sm text-muted-foreground">{w.User?.email || "—"}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                    {String(w.paymentMethod || "").replace(/_/g, " ")} ({currency})
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground text-right">
                    {prefix}{Number(w.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                    {String(details.bankName || "—")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                    {String(details.cedula || "—")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                    {String(details.phoneNumber || "—")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <Suspense fallback={<span className="text-xs text-muted-foreground">...</span>}>
                      <WithdrawalActions withdrawalId={w.id} />
                    </Suspense>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
