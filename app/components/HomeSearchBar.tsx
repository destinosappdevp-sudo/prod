"use client";

import { CalendarDays, MapPin, Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type SearchSuggestion = {
  id: string;
  slug: string;
  title: string;
  country?: string | null;
  municipality?: string | null;
  checkInTime?: string | null;
};

type MonthOption = {
  value: string;
  label: string;
};

export function HomeSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [selectedMonth, setSelectedMonth] = useState(searchParams.get("month") ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [months, setMonths] = useState<MonthOption[]>([]);

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
    setSelectedMonth(searchParams.get("month") ?? "");
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/available-months")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMonths(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", "6");
        if (value.trim()) {
          params.set("q", value.trim());
        }

        const response = await fetch(`/api/search-destinations?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar sugerencias");
        }

        const data = await response.json();
        setSuggestions(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 120);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, value]);

  function pushFilters(nextQ: string, nextMonth: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQ.trim()) {
      params.set("q", nextQ.trim());
    } else {
      params.delete("q");
    }
    if (nextMonth) {
      params.set("month", nextMonth);
    } else {
      params.delete("month");
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    pushFilters(value, selectedMonth);
    setIsOpen(false);
  }

  function handleClear() {
    setValue("");
    setSuggestions([]);
    pushFilters("", selectedMonth);
  }

  function handleMonthChange(monthValue: string) {
    setSelectedMonth(monthValue);
    pushFilters(value, monthValue);
  }

  function handleSuggestionSelect(item: SearchSuggestion) {
    router.push(`/destinos/${item.slug}`);
    setValue(item.title);
    setIsOpen(false);
  }

  function formatDeparture(raw?: string | null) {
    if (!raw) return "Próxima salida";
    const date = new Date(raw.includes("T") ? raw : `${raw}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "Próxima salida";
    return date.toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div
      className="mt-3 relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={value}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setValue(e.target.value);
              setIsOpen(true);
            }}
            placeholder="Buscar destino..."
            className="w-full pl-10 pr-10 py-2.5 rounded-full border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              aria-label="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>

        <div className="relative">
          <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="appearance-none pl-10 pr-8 py-2.5 rounded-full border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition cursor-pointer min-w-[170px]"
          >
            <option value="">Todas las Fechas</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </form>

      {isOpen && (
        <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-[#eadbb8] bg-white shadow-xl">
          <div className="border-b border-[#f2e7cb] bg-[#fffaf1] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#8a6500]">
            {value.trim() ? "Resultados por título" : "Destinos disponibles"}
          </div>

          {loading ? (
            <div className="px-4 py-4 text-sm text-slate-500">Buscando destinos...</div>
          ) : suggestions.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSuggestionSelect(item)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#fff7e6]"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {item.municipality || item.country || "Destino disponible"}
                      {item.country && item.municipality ? `, ${item.country}` : ""}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDeparture(item.checkInTime)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-slate-500">
              No se encontraron títulos de destinos para mostrar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
