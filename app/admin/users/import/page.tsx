"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ImportResult = {
  created: number;
  updated: number;
  errors: string[];
};

export default function ImportUsersPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setResult(null);
    setGlobalError(null);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setGlobalError(null);
    setResult(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/admin/users/import", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.error ?? "Error al importar");
      } else {
        setResult(data);
      }
    } catch {
      setGlobalError("Error de conexión al importar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Importar Usuarios desde CSV</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Sube un archivo <b>.csv</b> con los datos de los usuarios. El sistema detecta
          automáticamente el separador (<code>,</code> o <code>;</code>).
        </p>
      </div>

      {/* Guía de columnas */}
      <div className="rounded-lg border bg-blue-50 p-4 text-sm space-y-1">
        <p className="font-semibold text-blue-800 mb-2">Columnas reconocidas (en cualquier orden):</p>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-blue-700 list-disc ml-4">
          <li>Nombre y Apellido</li>
          <li>Correo electrónico <span className="text-red-500">*</span></li>
          <li>Numero de Cedula</li>
          <li>Fecha de Nacimiento</li>
          <li>Numero de Teléfono</li>
          <li>Teléfono Opcional</li>
          <li>Dirección de Habitación</li>
          <li>¿Viaja con Niños?</li>
          <li>Edades de los Niños</li>
          <li>Enfermedad o Lesión</li>
          <li>¿Ha Viajado con Destino&apos;s?</li>
          <li>Destino previo</li>
        </ul>
        <p className="text-blue-600 text-xs mt-2">
          <span className="text-red-500">*</span> El correo es obligatorio. Si el usuario ya existe se actualizan sus datos. Si no existe, se crea una cuenta nueva con contraseña temporal.
        </p>
      </div>

      {/* Uploader */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFile}
        />
        {file ? (
          <div className="space-y-1">
            <p className="font-semibold text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 7l-4-4-4 4" />
            </svg>
            <p className="text-gray-600 font-medium">Haz clic para seleccionar el CSV</p>
            <p className="text-xs text-gray-400">Solo archivos .csv</p>
          </div>
        )}
      </div>

      {globalError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
          {globalError}
        </div>
      )}

      <div className="flex gap-3">
        <button
          disabled={!file || loading}
          onClick={handleSubmit}
          className="px-6 py-2 rounded-lg bg-primary text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {loading ? "Importando…" : "Importar usuarios"}
        </button>
        <button
          onClick={() => router.push("/admin/users")}
          className="px-6 py-2 rounded-lg border text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>

      {/* Resultado */}
      {result && (
        <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Resultado de la importación</h2>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{result.created}</p>
              <p className="text-sm text-gray-500">Creados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{result.updated}</p>
              <p className="text-sm text-gray-500">Actualizados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">{result.errors.length}</p>
              <p className="text-sm text-gray-500">Errores</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="space-y-1">
              <p className="font-semibold text-red-600 text-sm">Filas con error:</p>
              <ul className="text-xs text-red-500 list-disc ml-4 space-y-1 max-h-48 overflow-y-auto">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {result.created + result.updated > 0 && (
            <button
              onClick={() => router.push("/admin/users")}
              className="mt-2 px-5 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors text-sm"
            >
              Ver usuarios →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
